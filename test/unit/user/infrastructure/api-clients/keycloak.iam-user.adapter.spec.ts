import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { ConfigService } from '@nestjs/config';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BadGatewayError, GatewayTimeoutError } from '../../../../../src/modules/shared/domain/errors/errors.js';
import { HttpClient } from '../../../../../src/modules/shared/infrastructure/http/http-client.js';
import { TokenService } from '../../../../../src/modules/shared/infrastructure/security/token.service.js';
import { KeycloakIamUserAdapter } from '../../../../../src/modules/user/infrastructure/api-clients/keycloak.iam-user.adapter.js';

const ADMIN = 'http://rmu-keycloak:8080/sso/admin/realms/rmu';
const TOKEN = 'http://rmu-keycloak:8080/sso/realms/rmu/protocol/openid-connect/token';

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

/** fetch answering the token request and then the admin calls with `admin`. */
const stubKeycloak = (admin: (url: string, init?: RequestInit) => Response | Promise<Response>) => {
  const fetch = vi.fn((url: string, init?: RequestInit) =>
    Promise.resolve(url === TOKEN ? json({ access_token: 'sa-token', expires_in: 300 }) : admin(url, init)),
  );
  vi.stubGlobal('fetch', fetch);
  return fetch;
};

const config = (extra: Record<string, unknown> = {}) =>
  new ConfigService({
    RMU_IAM_ADMIN_URI: ADMIN,
    RMU_IAM_TOKEN_URI: TOKEN,
    RMU_IAM_CLIENT_ID: 'rmu-client',
    RMU_IAM_CLIENT_SECRET: 's',
    ...extra,
  });

const adapter = (extra: Record<string, unknown> = {}) => {
  const cfg = config(extra);
  return new KeycloakIamUserAdapter(new TokenService(cfg), new HttpClient(cfg), cfg);
};

afterEach(() => {
  vi.unstubAllGlobals();
});

// F-users-24: the Keycloak calls go through the shared HttpClient, with its timeout and its error mapping.
describe('KeycloakIamUserAdapter', () => {
  it('reads a user with the service account token, and caches the token', async () => {
    const fetch = stubKeycloak(() =>
      json({ id: 'u-1', username: 'alice', email: 'a@x.test', federatedIdentities: [{ identityProvider: 'google' }] }),
    );
    const keycloak = adapter();

    expect(await keycloak.findById('u-1')).toMatchObject({ id: 'u-1', username: 'alice', enabled: true, identityProvider: 'google' });
    await keycloak.findById('u-1');

    expect(fetch.mock.calls.filter(([url]) => url === TOKEN)).toHaveLength(1);
    const [url, init] = fetch.mock.calls[1];
    expect(url).toBe(`${ADMIN}/users/u-1`);
    expect(init?.headers).toMatchObject({ Authorization: 'Bearer sa-token' });
  });

  it('answers null for an unknown user id', async () => {
    stubKeycloak(() => new Response('', { status: 404 }));
    expect(await adapter().findById('u-x')).toBeNull();
  });

  it('finds a user by exact username or email', async () => {
    const fetch = stubKeycloak(() => json([{ id: 'u-2', username: 'Bob', email: 'bob@x.test' }]));
    const keycloak = adapter();

    expect((await keycloak.findByUsername('bob'))?.id).toBe('u-2');
    expect((await keycloak.findByEmail('BOB@x.test'))?.id).toBe('u-2');
    expect(await keycloak.findByUsername('bobby')).toBeNull();
    expect(fetch.mock.calls[1][0]).toBe(`${ADMIN}/users?username=bob&exact=true&briefRepresentation=false&max=2`);
  });

  it('adds a user to a group and lists the groups', async () => {
    const fetch = stubKeycloak((url, init) =>
      init?.method === 'PUT' ? new Response(null, { status: 204 }) : json([{ id: 'g', name: 'core-law' }]),
    );
    const keycloak = adapter();

    await keycloak.addUserToGroup('u-1', 'g');
    expect(await keycloak.findGroups()).toEqual([{ id: 'g', name: 'core-law' }]);
    expect(fetch.mock.calls[1]).toEqual([`${ADMIN}/users/u-1/groups/g`, expect.objectContaining({ method: 'PUT', body: '{}' })]);
  });

  it('turns a failed admin call into a bad gateway error', async () => {
    stubKeycloak(() => new Response('down', { status: 503 }));
    await expect(adapter().addUserToGroup('u-1', 'g')).rejects.toBeInstanceOf(BadGatewayError);
    stubKeycloak(() => new Response('', { status: 404 }));
    await expect(adapter().findGroups()).rejects.toMatchObject({ statusCode: 502, status: 404 });
  });

  it('turns a failed token request into a bad gateway error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(json({ error: 'unauthorized_client' }, 401))),
    );
    await expect(adapter().findGroups()).rejects.toMatchObject({ statusCode: 502, status: 401 });
  });
});

describe('Keycloak timeout', () => {
  let server: Server | undefined;

  afterEach(async () => {
    server?.closeAllConnections();
    await new Promise(resolve => server?.close(resolve));
  });

  it('answers 504 when the token endpoint does not answer in RMU_HTTP_TIMEOUT_MS [F-users-24]', async () => {
    server = createServer(() => undefined);
    await new Promise<void>(resolve => server!.listen(0, '127.0.0.1', resolve));
    const { port } = server.address() as AddressInfo;
    const keycloak = adapter({ RMU_IAM_TOKEN_URI: `http://127.0.0.1:${port}/token`, RMU_HTTP_TIMEOUT_MS: 50 });

    const error = (await keycloak.findGroups().catch((e: unknown) => e)) as GatewayTimeoutError;

    expect(error).toBeInstanceOf(GatewayTimeoutError);
    expect(error).toMatchObject({ statusCode: 504, code: 'upstream-timeout' });
  });
});
