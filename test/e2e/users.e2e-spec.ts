import request from 'supertest';
import { MongoUserRepository } from '../../src/modules/user/infrastructure/db/mongo.user.repository.js';
import { USER_REPOSITORY } from '../../src/modules/user/application/ports/user-repository.port.js';
import { ISSUER } from './support/jwks.js';
import { ids, provision, startApp, USERS, type E2eApp } from './support/app.js';

type UserBody = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  enabled: boolean;
  features: string[];
  identityProvider: string;
  firstName: string | null;
  lastName: string | null;
  settings: { measurementSystem: string };
  imageUrl: string | null;
  claimsFingerprint?: string;
  version: number;
};

type ErrorBody = { statusCode: number; error: string; code: string; message: string; timestamp: string; path: string };

type PageBody<T> = { content: T[]; pagination: { page: number; size: number; totalElements: number; totalPages: number } };

let e2e: E2eApp;

beforeAll(async () => {
  e2e = await startApp();
});

afterAll(async () => {
  await e2e?.stop();
});

const me = (user: Parameters<E2eApp['auth']>[0]) => request(e2e.server).get('/v1/users/me').set('Authorization', e2e.auth(user));
const patchMe = (user: Parameters<E2eApp['auth']>[0], body: object) =>
  request(e2e.server).patch('/v1/users/me').set('Authorization', e2e.auth(user)).send(body);

describe('authentication', () => {
  it('rejects a request without a token', async () => {
    expect((await request(e2e.server).get('/v1/users/me')).status).toBe(401);
  });

  it('rejects a token signed with another key', async () => {
    expect((await request(e2e.server).get('/v1/users/me').set('Authorization', 'Bearer a.b.c')).status).toBe(401);
  });

  it('rejects a token from another issuer', async () => {
    expect((await me({ ...USERS.owner, iss: 'http://localhost:8090/realms/rmu' })).status).toBe(401);
  });

  it('rejects a token without the rmu-api audience', async () => {
    expect((await me({ ...USERS.owner, aud: 'account' })).status).toBe(401);
  });

  it('rejects an expired token', async () => {
    expect((await me({ ...USERS.owner, exp: Math.floor(Date.now() / 1000) - 60 })).status).toBe(401);
  });

  it('accepts a token whose audience list includes rmu-api', async () => {
    const response = await me({ sub: 'e2e-audience', preferred_username: 'audience', aud: ['account', 'rmu-api'], iss: ISSUER });
    expect(response.status).toBe(200);
  });
});

describe('GET /v1/users/me', () => {
  it('provisions the profile on first access and then serves it without writes, events or admin calls', async () => {
    const repository = e2e.app.get<MongoUserRepository>(USER_REPOSITORY);
    const save = vi.spyOn(repository, 'save');
    const update = vi.spyOn(repository, 'update');
    const lastLogin = vi.spyOn(repository, 'updateLastLoginAt');
    const findGroups = vi.spyOn(e2e.keycloak, 'findById');
    const before = e2e.events.events.length;

    const first = await me('owner');
    expect(first.status).toBe(200);
    expect(first.body).toMatchObject({
      id: USERS.owner.sub,
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
    expect((first.body as UserBody).claimsFingerprint).toBeUndefined();
    expect(e2e.events.types().slice(before)).toEqual(['user.created']);
    expect(save).toHaveBeenCalledTimes(1);

    const second = await me('owner');
    expect(second.status).toBe(200);
    expect(second.body).toEqual(first.body);
    expect(save).toHaveBeenCalledTimes(1);
    expect(update).not.toHaveBeenCalled();
    expect(lastLogin).not.toHaveBeenCalled();
    expect(e2e.events.events.length).toBe(before + 1);
    expect(findGroups).not.toHaveBeenCalled();
    vi.restoreAllMocks();
  });

  it('refreshes the profile when the token claims change', async () => {
    await provision(e2e, 'other');
    const before = e2e.events.events.length;
    const response = await me({ ...USERS.other, groups: ['rmu-user', 'core-law'], given_name: 'Robert' });
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ name: 'bob', features: ['rmu-user', 'core-law'], firstName: 'Robert' });
    expect(e2e.events.types().slice(before)).toEqual(['user.updated']);
  });

  it('names a Google profile after the email local part', async () => {
    const response = await me({
      sub: 'google-user',
      email: 'Carol.Smith@gmail.com',
      email_verified: true,
      preferred_username: 'carol.smith@gmail.com',
      identity_provider: 'google',
    });
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ name: 'carol.smith', identityProvider: 'google', features: [] });
  });

  it('gives a second profile with the same name a suffix', async () => {
    const response = await me({ sub: 'e2e-alice-2', preferred_username: 'Alice', email: 'alice2@example.com' });
    expect(response.status).toBe(200);
    expect((response.body as UserBody).name).toBe('alice-2');
  });
});

describe('PATCH /v1/users/me', () => {
  it('renames the profile, changes its settings and drops unknown fields', async () => {
    const before = e2e.events.events.length;
    const response = await patchMe('owner', { name: 'Alice W', settings: { measurementSystem: 'metric' }, ignored: 'stripped' });
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ name: 'Alice W', settings: { measurementSystem: 'metric' } });
    expect(response.body).not.toHaveProperty('ignored');
    expect(e2e.events.types().slice(before)).toEqual(['user.updated']);
  });

  it('sets and clears the image', async () => {
    const set = await patchMe('owner', { imageUrl: 'https://example.com/alice.png' });
    expect((set.body as UserBody).imageUrl).toBe('https://example.com/alice.png');
    const cleared = await patchMe('owner', { imageUrl: null });
    expect(cleared.status).toBe(200);
    expect((cleared.body as UserBody).imageUrl).toBeNull();
  });

  it('answers 409 on a display name taken by another profile, ignoring case', async () => {
    const response = await patchMe('owner', { name: 'CAROL.SMITH' });
    expect(response.status).toBe(409);
    expect(response.body).toMatchObject({ statusCode: 409, error: 'ConflictError', code: 'conflict', path: '/v1/users/me' });
  });

  it('keeps its own name in another case', async () => {
    const response = await patchMe('owner', { name: 'alice w' });
    expect(response.status).toBe(200);
    expect((response.body as UserBody).name).toBe('alice w');
  });

  it('rejects an invalid name, an invalid measurement system and an empty body', async () => {
    expect((await patchMe('owner', { name: '<x>' })).status).toBe(400);
    expect((await patchMe('owner', { name: 'a' })).status).toBe(400);
    expect((await patchMe('owner', { settings: { measurementSystem: 'cubits' } })).status).toBe(400);
    expect((await patchMe('owner', {})).status).toBe(400);
  });

  it('answers 404 before the profile exists', async () => {
    const response = await patchMe({ sub: 'e2e-no-profile', preferred_username: 'nobody' }, { name: 'Nobody' });
    expect(response.status).toBe(404);
  });

  // F-users-23, corrected in phase 5: a PATCH without changes returns the profile, without a write or an event.
  it('neither writes nor publishes when nothing changes', async () => {
    const current = (await me('owner')).body as UserBody;
    const before = e2e.events.events.length;
    const response = await patchMe('owner', { name: current.name, version: current.version });
    expect(response.status).toBe(200);
    expect((response.body as UserBody).version).toBe(current.version);
    expect(e2e.events.types().slice(before)).toEqual([]);
  });

  it('moves the version on each change and answers 409 to a stale one', async () => {
    const current = (await me('owner')).body as UserBody;
    const changed = await patchMe('owner', { imageUrl: 'https://example.test/a.png', version: current.version });
    expect(changed.status).toBe(200);
    expect((changed.body as UserBody).version).toBe(current.version + 1);

    const stale = await patchMe('owner', { imageUrl: null, version: current.version });
    expect(stale.status).toBe(409);
    expect((stale.body as ErrorBody).code).toBe('version-conflict');
    expect((await patchMe('owner', { imageUrl: null, version: -1 })).status).toBe(400);
    expect((await patchMe('owner', { imageUrl: null })).status).toBe(200);
  });

  it('never calls the Keycloak admin API', async () => {
    const calls = [vi.spyOn(e2e.keycloak, 'findById'), vi.spyOn(e2e.keycloak, 'findByUsername'), vi.spyOn(e2e.keycloak, 'addUserToGroup')];
    await patchMe('owner', { settings: { measurementSystem: 'imperial' } });
    for (const call of calls) expect(call).not.toHaveBeenCalled();
    vi.restoreAllMocks();
  });
});

describe('GET /v1/users/search', () => {
  it('returns the public projection of the profiles whose name starts with the prefix', async () => {
    const response = await request(e2e.server)
      .get('/v1/users/search')
      .query({ name: 'car', size: 5 })
      .set('Authorization', e2e.auth('owner'));
    expect(response.status).toBe(200);
    const page = response.body as PageBody<unknown>;
    expect(page.content).toEqual([{ id: 'google-user', name: 'carol.smith', imageUrl: null }]);
    expect(page.pagination).toMatchObject({ page: 0, size: 5, totalElements: 1 });
  });

  it('is open to users without roles', async () => {
    const response = await request(e2e.server).get('/v1/users/search').query({ name: 'b' }).set('Authorization', e2e.auth('noRole'));
    expect(response.status).toBe(200);
    expect(ids(response.body)).toEqual([USERS.other.sub]);
  });

  it('treats the prefix as text, not as a pattern', async () => {
    const response = await request(e2e.server).get('/v1/users/search').query({ name: '.*' }).set('Authorization', e2e.auth('owner'));
    expect(response.status).toBe(200);
    expect((response.body as PageBody<unknown>).content).toEqual([]);
  });

  it('requires a name and caps the page at 20', async () => {
    expect((await request(e2e.server).get('/v1/users/search').set('Authorization', e2e.auth('owner'))).status).toBe(400);
    const tooBig = await request(e2e.server).get('/v1/users/search').query({ name: 'a', size: 21 }).set('Authorization', e2e.auth('owner'));
    expect(tooBig.status).toBe(400);
  });
});

describe('GET /v1/users', () => {
  it('is reserved to rmu-admin', async () => {
    expect((await request(e2e.server).get('/v1/users').set('Authorization', e2e.auth('owner'))).status).toBe(403);
    expect((await request(e2e.server).get('/v1/users').set('Authorization', e2e.auth('noRole'))).status).toBe(403);
  });

  it('lists the full profiles with RSQL and paging', async () => {
    const all = await request(e2e.server).get('/v1/users').set('Authorization', e2e.auth('admin'));
    expect(all.status).toBe(200);
    const total = (all.body as PageBody<UserBody>).pagination.totalElements;
    expect(total).toBeGreaterThanOrEqual(5);
    expect((all.body as PageBody<UserBody>).content[0]).toHaveProperty('email');

    const google = await request(e2e.server)
      .get('/v1/users')
      .query({ q: 'identityProvider==google' })
      .set('Authorization', e2e.auth('admin'));
    expect(ids(google.body)).toEqual(['google-user']);

    const second = await request(e2e.server).get('/v1/users').query({ page: 1, size: 2 }).set('Authorization', e2e.auth('admin'));
    expect((second.body as PageBody<UserBody>).pagination).toMatchObject({ page: 1, size: 2, totalElements: total });
    expect((second.body as PageBody<UserBody>).content).toHaveLength(2);
  });

  it('rejects an invalid RSQL expression and an operator in a selector', async () => {
    expect((await request(e2e.server).get('/v1/users').query({ q: 'name==' }).set('Authorization', e2e.auth('admin'))).status).toBe(400);
    expect((await request(e2e.server).get('/v1/users').query({ q: '$where==1' }).set('Authorization', e2e.auth('admin'))).status).toBe(400);
  });

  // F-users-21, corrected in phase 5: pages of at most 100 elements. The error path has no query string (F-receta-22).
  it('caps the page size at 100', async () => {
    expect((await request(e2e.server).get('/v1/users').query({ size: 100 }).set('Authorization', e2e.auth('admin'))).status).toBe(200);
    const tooBig = await request(e2e.server).get('/v1/users').query({ size: 101 }).set('Authorization', e2e.auth('admin'));
    expect(tooBig.status).toBe(400);
    expect(tooBig.body).toMatchObject({ statusCode: 400, code: 'bad-request', path: '/v1/users' });
  });
});
