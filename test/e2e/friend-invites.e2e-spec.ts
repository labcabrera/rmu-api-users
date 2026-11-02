import request from 'supertest';
import { provision, startApp, USERS, type E2eApp, type UserName } from './support/app.js';

type InviteBody = { id: string; inviterId: string; inviterName: string; createdAt: string; expiresAt: string; token?: string };
type FriendshipBody = { id: string; requesterId: string; addresseeId: string; status: string };
type ErrorBody = { code: string };

let e2e: E2eApp;

// Spec 070: invite links and the daily limit of friend requests. owner is "alice", other is "bob", admin is "admin".
beforeAll(async () => {
  e2e = await startApp();
  await provision(e2e, 'owner', 'other', 'noRole', 'admin');
});

afterAll(async () => {
  await e2e?.stop();
});

const claims = (name: string) => ({ sub: `kc-${name}`, preferred_username: name, email: `${name}@example.com`, groups: ['rmu-user'] });
type Claims = ReturnType<typeof claims>;
const auth = (user: UserName | Claims) => e2e.auth(user);

const createInvite = (user: UserName | Claims) => request(e2e.server).post('/v1/friend-invites').set('Authorization', auth(user));
const listInvites = (user: UserName | Claims) => request(e2e.server).get('/v1/friend-invites').set('Authorization', auth(user));
const check = (user: UserName | Claims, token: string) =>
  request(e2e.server).post('/v1/friend-invites/check').set('Authorization', auth(user)).send({ token });
const accept = (user: UserName | Claims, token: string) =>
  request(e2e.server).post('/v1/friend-invites/accept').set('Authorization', auth(user)).send({ token });
const friendshipOf = async (a: string, b: string) => {
  const response = await request(e2e.server).get(`/v1/friendships/between/${a}/${b}`).set('Authorization', auth('admin'));
  return response.status === 200 ? (response.body as FriendshipBody) : null;
};
const newUser = async (name: string) => {
  const user = claims(name);
  await request(e2e.server).get('/v1/users/me').set('Authorization', auth(user)).expect(200);
  return user;
};

describe('invite links', () => {
  it('creates an invite whose token is only in the creation answer', async () => {
    const created = await createInvite('owner');
    expect(created.status).toBe(201);
    const body = created.body as InviteBody;
    expect(body).toMatchObject({ inviterId: USERS.owner.sub, inviterName: 'alice' });
    expect(body.token).toMatch(/^[A-Za-z0-9_-]{32}$/);
    const days = (Date.parse(body.expiresAt) - Date.parse(body.createdAt)) / 86_400_000;
    expect(days).toBe(7);

    const listed = (await listInvites('owner')).body as InviteBody[];
    expect(listed.map(i => i.id)).toContain(body.id);
    expect(listed.every(i => i.token === undefined)).toBe(true);
    expect(((await listInvites('other')).body as InviteBody[]).map(i => i.id)).not.toContain(body.id);
  });

  it('shows who invites, and makes them friends on accept, once', async () => {
    const carol = await newUser('carol');
    const { token } = (await createInvite('owner')).body as InviteBody;

    const preview = await check(carol, token!);
    expect(preview.status).toBe(200);
    expect(preview.body).toMatchObject({ inviterName: 'alice' });
    expect(preview.body).not.toHaveProperty('token');

    const accepted = await accept(carol, token!);
    expect(accepted.status).toBe(200);
    expect(accepted.body).toMatchObject({ requesterId: USERS.owner.sub, addresseeId: carol.sub, status: 'accepted' });

    const again = await accept(await newUser('dan'), token!);
    expect(again.status).toBe(404);
    expect((again.body as ErrorBody).code).toBe('friend-invite-invalid');
    expect((await check(carol, token!)).status).toBe(404);
  });

  it('turns a pending or rejected request into a friendship and publishes the change', async () => {
    const erin = await newUser('erin');
    const pending = (await request(e2e.server).post('/v1/friendships').set('Authorization', auth(erin)).send({ addresseeName: 'bob' }))
      .body as FriendshipBody;
    const { token } = (await createInvite('other')).body as InviteBody;
    e2e.events.events.splice(0);

    const accepted = await accept(erin, token!);
    expect(accepted.status).toBe(200);
    expect(accepted.body).toMatchObject({ id: pending.id, requesterId: USERS.other.sub, addresseeId: erin.sub, status: 'accepted' });
    expect(e2e.events.types()).toEqual(['friendship.updated']);
  });

  it('keeps the invite when the users are friends already, blocked, or the same user', async () => {
    const frank = await newUser('frank');
    const first = (await createInvite('owner')).body as InviteBody;
    expect((await accept(frank, first.token!)).status).toBe(200);

    const second = (await createInvite('owner')).body as InviteBody;
    const friends = await accept(frank, second.token!);
    expect(friends.status).toBe(409);
    expect((friends.body as ErrorBody).code).toBe('already-friends');
    const self = await accept('owner', second.token!);
    expect(self.status).toBe(400);
    expect((self.body as ErrorBody).code).toBe('friend-invite-self');

    const friendship = (await friendshipOf(USERS.owner.sub, frank.sub))!;
    await request(e2e.server)
      .patch(`/v1/friendships/${friendship.id}`)
      .set('Authorization', auth(frank))
      .send({ status: 'blocked' })
      .expect(200);
    const blocked = await accept(frank, second.token!);
    expect(blocked.status).toBe(409);
    expect((blocked.body as ErrorBody).code).toBe('friendship-blocked');

    // Still usable by somebody else.
    expect((await accept(await newUser('gina'), second.token!)).status).toBe(200);
  });

  it('lets only its inviter delete an invite', async () => {
    const invite = (await createInvite('owner')).body as InviteBody;
    const remove = (user: UserName) => request(e2e.server).delete(`/v1/friend-invites/${invite.id}`).set('Authorization', auth(user));
    expect((await remove('other')).status).toBe(404);
    expect((await remove('admin')).status).toBe(404);
    expect((await remove('owner')).status).toBe(204);
    expect((await check('other', invite.token!)).status).toBe(404);
    expect((await remove('owner')).status).toBe(404);
  });

  it('allows ten active invites per user', async () => {
    const hank = await newUser('hank');
    for (let i = 0; i < 10; i++) expect((await createInvite(hank)).status).toBe(201);
    const limit = await createInvite(hank);
    expect(limit.status).toBe(409);
    expect((limit.body as ErrorBody).code).toBe('friend-invite-limit');
  });

  it('needs rmu-user or rmu-admin to create and accept, a valid token and a token in the request', async () => {
    const { token } = (await createInvite('owner')).body as InviteBody;
    expect((await createInvite('noRole')).status).toBe(403);
    expect((await accept('noRole', token!)).status).toBe(403);
    // Reading who invites is open to any signed-in user.
    expect((await check('noRole', token!)).status).toBe(200);
    expect((await check('other', 'not a token!')).status).toBe(400);
    expect((await check('other', 'a'.repeat(32))).status).toBe(404);
    expect((await request(e2e.server).post('/v1/friend-invites/check').send({ token })).status).toBe(401);
  });

  it('ignores expired invites', async () => {
    const { id, token } = (await createInvite('owner')).body as InviteBody;
    await e2e.connection.collection('friend_invite').updateOne({ _id: id as never }, { $set: { expiresAt: new Date(Date.now() - 1000) } });
    expect((await check('other', token!)).status).toBe(404);
    expect((await accept('other', token!)).status).toBe(404);
    expect(((await listInvites('owner')).body as InviteBody[]).map(i => i.id)).not.toContain(id);
  });
});

// Spec 070, decision 3.
describe('daily limit of friend requests', () => {
  it('answers 429 to the 21st request of a day', async () => {
    const ivy = await newUser('ivy');
    for (let i = 0; i < 20; i++) {
      const addressee = await newUser(`target-${i}`);
      const response = await request(e2e.server)
        .post('/v1/friendships')
        .set('Authorization', auth(ivy))
        .send({ addresseeName: addressee.preferred_username });
      expect(response.status).toBe(201);
    }
    const extra = await newUser('target-extra');
    const limit = await request(e2e.server)
      .post('/v1/friendships')
      .set('Authorization', auth(ivy))
      .send({ addresseeName: extra.preferred_username });
    expect(limit.status).toBe(429);
    expect((limit.body as ErrorBody).code).toBe('friend-request-limit');
    // Invites are not requests: they still work.
    expect((await createInvite(ivy)).status).toBe(201);
  });
});
