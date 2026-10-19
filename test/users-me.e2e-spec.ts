import { afterAll, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { Test } from '@nestjs/testing';
import { createServer, Server } from 'http';
import { AddressInfo } from 'net';
import { createSign, generateKeyPairSync, KeyObject } from 'crypto';
import request from 'supertest';
import { App } from 'supertest/types';
import { configureApp } from 'src/app.setup';
import { JwtStrategy } from 'src/modules/auth/jwt.strategy';
import { IamUserPort } from 'src/modules/user/application/ports/iam-user.port';
import { UserEventBusPort } from 'src/modules/user/application/ports/user-event-bus.port';
import { UserRepository } from 'src/modules/user/application/ports/user-repository';
import { UserProvisioningService } from 'src/modules/user/application/services/user-provisioning.service';
import { UserController } from 'src/modules/user/interfaces/http/user.controller';
import { USER_HANDLERS } from 'src/modules/user/user.module';
import { InMemoryUserRepository } from './support/in-memory-user.repository';

const ISSUER = 'http://localhost/sso/realms/rmu';
const AUDIENCE = 'rmu-api';
const KID = 'e2e-key';

const b64url = (value: object | Buffer) => (Buffer.isBuffer(value) ? value : Buffer.from(JSON.stringify(value))).toString('base64url');

function signToken(privateKey: KeyObject, claims: Record<string, unknown>): string {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url({ alg: 'RS256', typ: 'JWT', kid: KID });
  const payload = b64url({ iss: ISSUER, aud: ['account', AUDIENCE], iat: now, exp: now + 300, ...claims });
  const signature = createSign('RSA-SHA256').update(`${header}.${payload}`).sign(privateKey);
  return `${header}.${payload}.${b64url(signature)}`;
}

/**
 * GET/PATCH /v1/users/me through the real JWT strategy (RS256 against a local JWKS endpoint, issuer and audience
 * checks) and the real CQRS handlers, with in-memory adapters for Mongo, Kafka and the Keycloak admin API.
 */
describe('/v1/users (e2e)', () => {
  const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  let jwks: Server;
  let app: INestApplication<App>;
  const http = () => app.getHttpServer();
  let repository: InMemoryUserRepository;
  const publish = jest.fn<UserEventBusPort['publish']>();
  const iamCalls = jest.fn();
  const iam = new Proxy({} as IamUserPort, {
    get: (_target, prop) => (prop === 'then' ? undefined : (...args: unknown[]) => iamCalls(prop, ...args)),
  });

  const claims = {
    sub: 'b9d2b52d-5b4d-4ab7-a59d-93bb67e32ce1',
    email: 'alice@example.com',
    email_verified: true,
    preferred_username: 'alice',
    given_name: 'Alice',
    family_name: 'Liddell',
    groups: ['rmu-user'],
  };

  beforeAll(async () => {
    const jwk = { ...publicKey.export({ format: 'jwk' }), kid: KID, use: 'sig', alg: 'RS256' };
    jwks = createServer((_req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ keys: [jwk] }));
    });
    await new Promise<void>(resolve => jwks.listen(0, '127.0.0.1', resolve));
    const { port } = jwks.address() as AddressInfo;

    repository = new InMemoryUserRepository();
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [
            () => ({
              RMU_IAM_JWK_URI: `http://127.0.0.1:${port}/certs`,
              RMU_IAM_ISSUER_URI: ISSUER,
              RMU_IAM_AUDIENCE: AUDIENCE,
            }),
          ],
        }),
        CqrsModule.forRoot(),
      ],
      controllers: [UserController],
      providers: [
        ...USER_HANDLERS,
        UserProvisioningService,
        JwtStrategy,
        { provide: UserRepository, useValue: repository },
        { provide: IamUserPort, useValue: iam },
        { provide: UserEventBusPort, useValue: { publish } },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
    await new Promise(resolve => jwks?.close(resolve));
  });

  beforeEach(() => {
    publish.mockClear();
    iamCalls.mockClear();
  });

  it('rejects requests without a token', async () => {
    await request(http()).get('/v1/users/me').expect(401);
  });

  it('rejects a token from another issuer', async () => {
    const token = signToken(privateKey, { ...claims, iss: 'http://localhost:8090/realms/rmu' });
    await request(http()).get('/v1/users/me').set('Authorization', `Bearer ${token}`).expect(401);
  });

  it('rejects a token without the rmu-api audience', async () => {
    const token = signToken(privateKey, { ...claims, aud: 'account' });
    await request(http()).get('/v1/users/me').set('Authorization', `Bearer ${token}`).expect(401);
  });

  it('provisions the profile on first GET /me and then serves it without writes or admin calls', async () => {
    const token = signToken(privateKey, claims);

    const first = await request(http()).get('/v1/users/me').set('Authorization', `Bearer ${token}`).expect(200);
    expect(first.body).toMatchObject({
      id: claims.sub,
      name: 'alice',
      email: 'alice@example.com',
      emailVerified: true,
      enabled: true,
      features: ['rmu-user'],
      identityProvider: 'local',
      firstName: 'Alice',
      lastName: 'Liddell',
      settings: { measurementSystem: 'imperial' },
      imageUrl: null,
    });
    expect((first.body as Record<string, unknown>).claimsFingerprint).toBeUndefined();
    expect(publish).toHaveBeenCalledTimes(1);

    const writes = repository.writes;
    await request(http()).get('/v1/users/me').set('Authorization', `Bearer ${token}`).expect(200);
    expect(repository.writes).toBe(writes);
    expect(publish).toHaveBeenCalledTimes(1);
    expect(iamCalls).not.toHaveBeenCalled();
  });

  it('creates a Google profile named after the email local part', async () => {
    const token = signToken(privateKey, {
      sub: 'google-user',
      email: 'Carol.Smith@gmail.com',
      email_verified: true,
      preferred_username: 'carol.smith@gmail.com',
      identity_provider: 'google',
    });
    const res = await request(http()).get('/v1/users/me').set('Authorization', `Bearer ${token}`).expect(200);
    expect(res.body).toMatchObject({ name: 'carol.smith', identityProvider: 'google', features: [] });
  });

  it('PATCH /me renames the profile and answers 409 on a taken name', async () => {
    const token = signToken(privateKey, claims);

    const renamed = await request(http())
      .patch('/v1/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Alice W', settings: { measurementSystem: 'metric' }, ignored: 'stripped' })
      .expect(200);
    expect(renamed.body).toMatchObject({ name: 'Alice W', settings: { measurementSystem: 'metric' } });

    const conflict = await request(http())
      .patch('/v1/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'CAROL.SMITH' })
      .expect(409);
    expect((conflict.body as { error: string }).error).toBe('ConflictError');

    await request(http()).patch('/v1/users/me').set('Authorization', `Bearer ${token}`).send({ name: '<x>' }).expect(400);
    expect(iamCalls).not.toHaveBeenCalled();
  });

  it('GET /users/search returns the public projection only', async () => {
    const token = signToken(privateKey, claims);
    const res = await request(http())
      .get('/v1/users/search')
      .query({ name: 'car', size: 5 })
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect((res.body as { content: unknown }).content).toEqual([{ id: 'google-user', name: 'carol.smith', imageUrl: null }]);
    expect((res.body as { pagination: unknown }).pagination).toMatchObject({ page: 0, size: 5, totalElements: 1 });

    await request(http()).get('/v1/users/search').set('Authorization', `Bearer ${token}`).expect(400);
  });

  it('GET /users is reserved to rmu-admin', async () => {
    const user = signToken(privateKey, claims);
    await request(http()).get('/v1/users').set('Authorization', `Bearer ${user}`).expect(403);

    const admin = signToken(privateKey, { ...claims, groups: ['rmu-user', 'rmu-admin'] });
    const res = await request(http()).get('/v1/users').set('Authorization', `Bearer ${admin}`).expect(200);
    expect((res.body as { pagination: { totalElements: number } }).pagination.totalElements).toBe(2);
  });
});
