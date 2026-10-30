import type { NestExpressApplication } from '@nestjs/platform-express';
import { getConnectionToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import type { Connection } from 'mongoose';
import request from 'supertest';
import { configureHttp } from '../../../src/bootstrap/http.js';
import { configureOpenApi } from '../../../src/bootstrap/openapi.js';
import {
  DOMAIN_EVENT_PUBLISHER,
  type DomainEventPublisher,
} from '../../../src/modules/shared/application/ports/domain-event-publisher.port.js';
import type { DomainEvent } from '../../../src/modules/shared/domain/events/domain-event.js';
import { BadGatewayError } from '../../../src/modules/shared/domain/errors/errors.js';
import { KafkaProducerService } from '../../../src/modules/shared/infrastructure/messaging/kafka-producer.service.js';
import {
  type IamUserPort,
  IAM_USER_PORT,
  type UserApiResponse,
  type UserGroup,
} from '../../../src/modules/user/application/ports/iam-user.port.js';
import { AUDIENCE, ISSUER, LocalJwks, type TokenClaims } from './jwks.js';

export type Server = Parameters<typeof request>[0];

/** The users of the suite: their token claims, with the Keycloak groups. */
export const USERS = {
  admin: {
    sub: 'e2e-admin',
    preferred_username: 'admin',
    email: 'admin@example.com',
    email_verified: true,
    groups: ['rmu-user', 'rmu-admin'],
  },
  owner: {
    sub: 'e2e-owner',
    preferred_username: 'alice',
    email: 'alice@example.com',
    email_verified: true,
    given_name: 'Alice',
    family_name: 'Liddell',
    groups: ['rmu-user'],
  },
  other: { sub: 'e2e-other', preferred_username: 'bob', email: 'bob@example.com', email_verified: true, groups: ['rmu-user'] },
  noRole: { sub: 'e2e-guest', preferred_username: 'guest', email: 'guest@example.com', email_verified: false, groups: [] as string[] },
} satisfies Record<string, TokenClaims>;

export type UserName = keyof typeof USERS;

/** A published event, with the aggregate type the topic is built from. */
export type PublishedEvent = { aggregateType: string; event: DomainEvent<unknown> };

/** DomainEventPublisher that keeps the events instead of sending them to Kafka. */
export class InMemoryEventPublisher implements DomainEventPublisher {
  readonly events: PublishedEvent[] = [];

  publish(aggregateType: string, ...events: DomainEvent<unknown>[]): Promise<void> {
    this.events.push(...events.map(event => ({ aggregateType, event })));
    return Promise.resolve();
  }

  publishChanges(): Promise<void> {
    return Promise.resolve();
  }

  types(): string[] {
    return this.events.map(({ aggregateType, event }) => `${aggregateType}.${event.eventType}`);
  }
}

/** The Keycloak admin API of the suite: accounts by id, the realm groups and the group assignments. */
export class FakeKeycloak implements IamUserPort {
  readonly users = new Map<string, UserApiResponse>();
  readonly groups: UserGroup[] = [
    { id: 'g-core-law', name: 'rmu-core-law' },
    { id: 'g-spell-law', name: 'rmu-spell-law' },
    { id: 'g-treasure-law', name: 'rmu-treasure-law' },
    { id: 'g-creature-law-i', name: 'rmu-creature-law-i' },
    { id: 'g-user', name: 'rmu-user' },
    { id: 'g-admin', name: 'rmu-admin' },
  ];
  readonly assignments: { userId: string; groupId: string }[] = [];
  readonly enabledChanges: { userId: string; enabled: boolean }[] = [];
  /** When set, addUserToGroup fails (Keycloak down). */
  failGroupAssignment = false;

  findById(id: string): Promise<UserApiResponse | null> {
    return Promise.resolve(this.users.get(id) ?? null);
  }

  findByUsername(username: string): Promise<UserApiResponse | null> {
    return Promise.resolve([...this.users.values()].find(user => user.username.toLowerCase() === username.toLowerCase()) ?? null);
  }

  findByEmail(email: string): Promise<UserApiResponse | null> {
    return Promise.resolve([...this.users.values()].find(user => user.email.toLowerCase() === email.toLowerCase()) ?? null);
  }

  addUserToGroup(userId: string, groupId: string): Promise<void> {
    // What KeycloakIamUserAdapter throws for a 503 of the admin API (the HttpClient mapping).
    if (this.failGroupAssignment)
      return Promise.reject(new BadGatewayError('rmu-keycloak/sso/admin/realms/rmu/users/x/groups/y answered 503'));
    this.assignments.push({ userId, groupId });
    return Promise.resolve();
  }

  findGroups(): Promise<UserGroup[]> {
    return Promise.resolve(this.groups);
  }

  removeUserFromGroup(userId: string, groupId: string): Promise<void> {
    const index = this.assignments.findIndex(a => a.userId === userId && a.groupId === groupId);
    if (index >= 0) this.assignments.splice(index, 1);
    return Promise.resolve();
  }

  findUserGroups(userId: string): Promise<UserGroup[]> {
    const ids = new Set(this.assignments.filter(a => a.userId === userId).map(a => a.groupId));
    return Promise.resolve(this.groups.filter(group => ids.has(group.id)));
  }

  setEnabled(userId: string, enabled: boolean): Promise<void> {
    this.enabledChanges.push({ userId, enabled });
    return Promise.resolve();
  }
}

export type E2eApp = {
  app: NestExpressApplication;
  server: Server;
  jwks: LocalJwks;
  events: InMemoryEventPublisher;
  keycloak: FakeKeycloak;
  connection: Connection;
  /** Authorization header of a suite user, or of any claims. */
  auth: (user: UserName | TokenClaims) => string;
  stop: () => Promise<void>;
};

/**
 * Boots the whole AppModule as main.ts does (configureHttp and configureOpenApi) against an in-memory Mongo and a
 * local JWKS. Kafka is replaced by an in-memory DomainEventPublisher (and a producer that never connects) and the
 * Keycloak admin API by FakeKeycloak. AppModule is imported after setting the environment, because
 * ConfigModule.forRoot() reads it when the module is evaluated.
 */
export async function startApp(env: Record<string, string> = {}): Promise<E2eApp> {
  const mongo = await MongoMemoryServer.create();
  const jwks = new LocalJwks();
  await jwks.start();
  Object.assign(process.env, {
    RMU_MONGO_USERS_URI: mongo.getUri('rmu-users-e2e'),
    RMU_IAM_JWK_URI: jwks.uri,
    RMU_IAM_ISSUER_URI: ISSUER,
    RMU_IAM_AUDIENCE: AUDIENCE,
    RMU_IAM_TOKEN_URI: 'http://127.0.0.1:1/token',
    RMU_IAM_ADMIN_URI: 'http://127.0.0.1:1/admin/realms/rmu',
    RMU_IAM_CLIENT_ID: 'rmu-api-users-e2e',
    RMU_IAM_CLIENT_SECRET: 'e2e',
    RMU_KAFKA_BROKERS: 'localhost:9092',
    RMU_KAFKA_CLIENT_ID: 'rmu-api-users-e2e',
    RMU_THROTTLE_LIMIT: '0',
    RMU_CORS_ORIGINS: '',
    ...env,
  });

  const events = new InMemoryEventPublisher();
  const keycloak = new FakeKeycloak();
  const { AppModule } = await import('../../../src/app.module.js');
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(KafkaProducerService)
    .useValue({ emit: () => Promise.resolve() })
    .overrideProvider(DOMAIN_EVENT_PUBLISHER)
    .useValue(events)
    .overrideProvider(IAM_USER_PORT)
    .useValue(keycloak)
    .compile();
  const app = moduleRef.createNestApplication<NestExpressApplication>({ logger: ['error'] });
  configureHttp(app);
  configureOpenApi(app);
  await app.init();

  return {
    app,
    server: app.getHttpServer() as Server,
    jwks,
    events,
    keycloak,
    connection: app.get<Connection>(getConnectionToken()),
    auth: user => `Bearer ${jwks.token(typeof user === 'string' ? USERS[user] : user)}`,
    stop: async () => {
      await app.close();
      await jwks.stop();
      await mongo.stop();
    },
  };
}

/** The ids of a page response. */
export const ids = (body: unknown) => (body as { content: { id: string }[] }).content.map(item => item.id);

/** Creates the RMU profile of a suite user (GET /v1/users/me provisions it from the token). */
export async function provision(e2e: E2eApp, ...users: UserName[]): Promise<void> {
  for (const user of users) {
    const response = await request(e2e.server).get('/v1/users/me').set('Authorization', e2e.auth(user));
    if (response.status !== 200) throw new Error(`Could not provision ${user}: ${response.status}`);
  }
}
