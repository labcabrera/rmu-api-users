import request from 'supertest';
import { ids, provision, startApp, USERS, type E2eApp, type UserName } from './support/app.js';

type FriendshipBody = {
  id: string;
  requesterId: string;
  requesterName: string;
  addresseeId: string;
  addresseeName: string;
  status: string;
  message: string | null;
  version: number;
};

type PageBody<T> = { content: T[]; pagination: { page: number; size: number; totalElements: number } };

let e2e: E2eApp;

// owner is "alice", other is "bob", noRole is "guest" and admin is "admin" (their RMU display names).
beforeAll(async () => {
  e2e = await startApp();
  await provision(e2e, 'owner', 'other', 'noRole', 'admin');
});

afterAll(async () => {
  await e2e?.stop();
});

const befriend = (user: UserName, addresseeName: string, message?: string) =>
  request(e2e.server).post('/v1/friendships').set('Authorization', e2e.auth(user)).send({ addresseeName, message });

const patch = (user: UserName, id: string, status: string) =>
  request(e2e.server).patch(`/v1/friendships/${id}`).set('Authorization', e2e.auth(user)).send({ status });

const get = (user: UserName, id: string) => request(e2e.server).get(`/v1/friendships/${id}`).set('Authorization', e2e.auth(user));

const list = (user: UserName, query: Record<string, string | number> = {}) =>
  request(e2e.server).get('/v1/friendships').query(query).set('Authorization', e2e.auth(user));

describe('request', () => {
  it('creates a pending request to a user by display name', async () => {
    const response = await befriend('owner', 'bob', 'Shall we play?');
    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      requesterId: USERS.owner.sub,
      requesterName: 'alice',
      addresseeId: USERS.other.sub,
      addresseeName: 'bob',
      status: 'pending',
      message: 'Shall we play?',
    });
  });

  it('answers 409 to a second request between the same users, in either direction', async () => {
    expect((await befriend('owner', 'bob')).status).toBe(409);
    expect((await befriend('other', 'alice')).status).toBe(409);
  });

  it('rejects a request to oneself, to an unknown user and without a name', async () => {
    expect((await befriend('owner', 'alice')).status).toBe(400);
    expect((await befriend('owner', 'nobody-at-all')).status).toBe(400);
    expect((await request(e2e.server).post('/v1/friendships').set('Authorization', e2e.auth('owner')).send({})).status).toBe(400);
  });

  it('provisions the addressee from Keycloak when it never logged into RMU', async () => {
    e2e.keycloak.users.set('kc-dave', {
      id: 'kc-dave',
      username: 'dave',
      email: 'dave@example.com',
      emailVerified: true,
      enabled: true,
      firstName: 'Dave',
    });
    const response = await befriend('owner', 'dave');
    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({ addresseeId: 'kc-dave', addresseeName: 'dave' });
    expect(e2e.events.types()).toContain('user.created');
  });

  it('finds a Keycloak user by email and ignores a disabled one', async () => {
    e2e.keycloak.users.set('kc-erin', { id: 'kc-erin', username: 'erin', email: 'erin@example.com', emailVerified: true, enabled: true });
    e2e.keycloak.users.set('kc-frank', {
      id: 'kc-frank',
      username: 'frank',
      email: 'frank@example.com',
      emailVerified: true,
      enabled: false,
    });
    expect((await befriend('other', 'erin@example.com')).status).toBe(201);
    expect((await befriend('other', 'frank')).status).toBe(400);
  });

  it('answers 400 to a requester without a profile', async () => {
    const response = await request(e2e.server)
      .post('/v1/friendships')
      .set('Authorization', e2e.auth({ sub: 'e2e-no-profile', preferred_username: 'ghost', groups: ['rmu-user'] }))
      .send({ addresseeName: 'bob' });
    expect(response.status).toBe(400);
  });

  // Spec 021, decision 2: creating needs rmu-user or rmu-admin; a token without groups is read-only.
  it('is forbidden to users without roles', async () => {
    const response = await befriend('noRole', 'bob');
    expect(response.status).toBe(403);
    expect((response.body as { code: string }).code).toBe('forbidden');
  });
});

describe('list and read', () => {
  it('shows a request to both participants only', async () => {
    const created = (await befriend('admin', 'alice')).body as FriendshipBody;
    expect(ids((await list('owner')).body)).toContain(created.id);
    expect(ids((await list('admin')).body)).toContain(created.id);
    expect(ids((await list('other')).body)).not.toContain(created.id);

    expect((await get('owner', created.id)).status).toBe(200);
    expect((await get('admin', created.id)).status).toBe(200);
    expect((await get('other', created.id)).status).toBe(404);
  });

  it('filters with RSQL inside the participant filter and pages', async () => {
    const all = (await list('owner')).body as PageBody<FriendshipBody>;
    expect(all.pagination.totalElements).toBe(3);
    const toAlice = await list('owner', { q: `addresseeId==${USERS.owner.sub}` });
    expect((toAlice.body as PageBody<FriendshipBody>).content.map(f => f.requesterName)).toEqual(['admin']);
    // Another user's requests cannot be reached through RSQL.
    const foreign = await list('owner', { q: `requesterId==${USERS.noRole.sub}` });
    expect(ids(foreign.body)).toEqual([]);
    const page = await list('owner', { page: 1, size: 2 });
    expect((page.body as PageBody<FriendshipBody>).content).toHaveLength(1);
  });

  it('answers 404 for an unknown friendship', async () => {
    expect((await get('owner', 'unknown')).status).toBe(404);
  });
});

describe('answer', () => {
  it('lets the addressee accept a request', async () => {
    const created = (await befriend('admin', 'guest')).body as FriendshipBody;
    const accepted = await patch('noRole', created.id, 'accepted');
    expect(accepted.status).toBe(200);
    expect((accepted.body as FriendshipBody).status).toBe('accepted');
    expect((accepted.body as FriendshipBody).version).toBe(1);
    expect((await befriend('admin', 'guest')).status).toBe(409);

    // A stale version is a 409; the same status again changes nothing.
    const send = (body: object) =>
      request(e2e.server).patch(`/v1/friendships/${created.id}`).set('Authorization', e2e.auth('noRole')).send(body);
    const stale = await send({ status: 'rejected', version: 0 });
    expect(stale.status).toBe(409);
    expect((stale.body as { code: string }).code).toBe('version-conflict');
    const same = await send({ status: 'accepted', version: 1 });
    expect(same.status).toBe(200);
    expect((same.body as FriendshipBody).version).toBe(1);
  });

  it('forbids the requester and other users to answer', async () => {
    const created = (await befriend('admin', 'bob')).body as FriendshipBody;
    expect((await patch('admin', created.id, 'accepted')).status).toBe(403);
    expect((await patch('owner', 'unknown', 'accepted')).status).toBe(404);
  });

  it('answers 404 to a user outside the friendship [F-users-18]', async () => {
    const created = (await befriend('owner', 'guest')).body as FriendshipBody;
    const response = await patch('other', created.id, 'accepted');
    expect(response.status).toBe(404);
    expect((response.body as { code: string }).code).toBe('not-found');
  });

  it('rejects an unknown status', async () => {
    const created = (await befriend('owner', 'guest')).body as FriendshipBody;
    expect((await patch('noRole', created.id, 'married')).status).toBe(400);
  });

  // F-users-16: any status can follow any other one, so an accepted friendship goes back to pending.
  it('lets the addressee move an accepted friendship back to pending', async () => {
    const created = (await befriend('admin', 'dave')).body as FriendshipBody;
    const daveToken = { sub: 'kc-dave', preferred_username: 'dave' };
    const answer = (status: string) =>
      request(e2e.server).patch(`/v1/friendships/${created.id}`).set('Authorization', e2e.auth(daveToken)).send({ status });
    expect((await answer('accepted')).status).toBe(200);
    const back = await answer('pending');
    expect(back.status).toBe(200);
    expect((back.body as FriendshipBody).status).toBe('pending');
  });

  it.skip('rejects moving an accepted friendship back to pending [F-users-16]', async () => {
    const created = (await befriend('owner', 'erin')).body as FriendshipBody;
    const erinToken = { sub: 'kc-erin', preferred_username: 'erin' };
    const answer = (status: string) =>
      request(e2e.server).patch(`/v1/friendships/${created.id}`).set('Authorization', e2e.auth(erinToken)).send({ status });
    expect((await answer('accepted')).status).toBe(200);
    expect((await answer('pending')).status).toBe(400);
  });

  // F-users-17: after a rejection no new request is possible: it answers 409 'Not implemented friendship status'.
  it('blocks a new request after a rejection', async () => {
    const created = (await befriend('admin', 'erin')).body as FriendshipBody;
    const erinToken = { sub: 'kc-erin', preferred_username: 'erin' };
    await request(e2e.server).patch(`/v1/friendships/${created.id}`).set('Authorization', e2e.auth(erinToken)).send({ status: 'rejected' });
    const again = await befriend('admin', 'erin');
    expect(again.status).toBe(409);
    expect((again.body as { message: string }).message).toBe('Not implemented friendship status');
  });

  it.skip('allows a new request after a rejection [F-users-17]', async () => {
    const again = await befriend('admin', 'erin');
    expect(again.status).toBe(201);
  });
});

describe('delete', () => {
  it('lets either participant delete a friendship, and nobody else', async () => {
    const created = (await befriend('other', 'dave')).body as FriendshipBody;
    expect((await request(e2e.server).delete(`/v1/friendships/${created.id}`).set('Authorization', e2e.auth('owner'))).status).toBe(404);
    expect((await request(e2e.server).delete(`/v1/friendships/${created.id}`).set('Authorization', e2e.auth('other'))).status).toBe(204);
    expect((await get('other', created.id)).status).toBe(404);
  });
});

it('requires a token', async () => {
  expect((await request(e2e.server).get('/v1/friendships')).status).toBe(401);
});

// Spec 021, decision 2: owner (the requester), the addressee, another user, an admin outside the friendship, a user
// without roles and no token, for each change.
describe('permission matrix', () => {
  const carol = { sub: 'e2e-carol', preferred_username: 'carol', email: 'carol@example.com', groups: ['rmu-user'] };
  const outsiderAdmin = { sub: 'e2e-admin-out', preferred_username: 'admin-out', groups: ['rmu-admin'] };
  const as = (claims: object) => e2e.auth(claims as never);

  beforeAll(async () => {
    for (const claims of [carol, outsiderAdmin]) await request(e2e.server).get('/v1/users/me').set('Authorization', as(claims));
  });

  it('creates with rmu-user or rmu-admin only', async () => {
    expect((await befriend('owner', 'carol')).status).toBe(201);
    expect(
      (await request(e2e.server).post('/v1/friendships').set('Authorization', as(outsiderAdmin)).send({ addresseeName: 'bob' })).status,
    ).toBe(201);
    expect((await befriend('noRole', 'carol')).status).toBe(403);
    expect((await request(e2e.server).post('/v1/friendships').send({ addresseeName: 'carol' })).status).toBe(401);
  });

  it('lets only the addressee answer: 403 to the requester, 404 to anybody else', async () => {
    const created = (await request(e2e.server).post('/v1/friendships').set('Authorization', as(carol)).send({ addresseeName: 'bob' }))
      .body as FriendshipBody;
    const answer = (auth: string | undefined) => {
      const req = request(e2e.server).patch(`/v1/friendships/${created.id}`);
      return (auth ? req.set('Authorization', auth) : req).send({ status: 'accepted' });
    };
    expect((await answer(as(carol))).status).toBe(403);
    expect((await answer(e2e.auth('owner'))).status).toBe(404);
    expect((await answer(as(outsiderAdmin))).status).toBe(404);
    expect((await answer(e2e.auth('noRole'))).status).toBe(404);
    expect((await answer(undefined)).status).toBe(401);
    expect((await answer(e2e.auth('other'))).status).toBe(200);
  });

  it('lets only the participants delete: 404 to anybody else', async () => {
    const created = (await request(e2e.server).post('/v1/friendships').set('Authorization', as(carol)).send({ addresseeName: 'guest' }))
      .body as FriendshipBody;
    const remove = (auth?: string) => {
      const req = request(e2e.server).delete(`/v1/friendships/${created.id}`);
      return auth ? req.set('Authorization', auth) : req;
    };
    expect((await remove(e2e.auth('owner'))).status).toBe(404);
    expect((await remove(as(outsiderAdmin))).status).toBe(404);
    expect((await remove()).status).toBe(401);
    // The addressee has no roles, but the friendship is its own.
    expect((await remove(e2e.auth('noRole'))).status).toBe(204);
  });
});
