import request from 'supertest';
import { ids, provision, startApp, USERS, type E2eApp, type UserName } from './support/app.js';

type MessageBody = { id: string; userId: string; from: string; message: string; type: string; readed: string | null; createdAt: string };

let e2e: E2eApp;

// owner (alice) and other (bob) are accepted friends; noRole (guest) and admin are friends of nobody.
beforeAll(async () => {
  e2e = await startApp();
  await provision(e2e, 'owner', 'other', 'noRole', 'admin');
  const friendship = await request(e2e.server)
    .post('/v1/friendships')
    .set('Authorization', e2e.auth('owner'))
    .send({ addresseeName: 'bob' });
  await request(e2e.server)
    .patch(`/v1/friendships/${(friendship.body as { id: string }).id}`)
    .set('Authorization', e2e.auth('other'))
    .send({ status: 'accepted' });
});

afterAll(async () => {
  await e2e?.stop();
});

const send = (user: UserName, recipientId: string, message = 'Hello', type = 'info') =>
  request(e2e.server).post('/v1/user-messages').set('Authorization', e2e.auth(user)).send({ recipientId, message, type });

const inbox = (user: UserName) => request(e2e.server).get('/v1/user-messages').set('Authorization', e2e.auth(user));

describe('send', () => {
  it('stores a message from the caller to an accepted friend', async () => {
    const response = await send('owner', USERS.other.sub, 'Hi Bob', 'alert');
    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({ userId: USERS.other.sub, from: USERS.owner.sub, message: 'Hi Bob', type: 'alert', readed: null });
  });

  it('rejects a message to an unknown recipient [F-users-09]', async () => {
    const response = await send('owner', 'no-such-user');
    expect(response.status).toBe(404);
    expect((response.body as { code: string }).code).toBe('not-found');
  });

  it('rejects a message to a user that is not an accepted friend [F-users-09]', async () => {
    const response = await send('owner', USERS.noRole.sub);
    expect(response.status).toBe(403);
    expect((response.body as { code: string }).code).toBe('not-friends');
  });

  it('rejects an unknown type, a missing recipient and a message over 1000 characters', async () => {
    expect((await send('owner', USERS.other.sub, 'Hi', 'spam')).status).toBe(400);
    expect(
      (await request(e2e.server).post('/v1/user-messages').set('Authorization', e2e.auth('owner')).send({ message: 'Hi', type: 'info' }))
        .status,
    ).toBe(400);
    expect((await send('owner', USERS.other.sub, 'x'.repeat(1001))).status).toBe(400);
  });
});

describe('inbox', () => {
  it.skip('lists the messages of the caller, newest first [F-users-08]', async () => {
    await send('admin', USERS.owner.sub, 'Welcome');
    await send('other', USERS.owner.sub, 'Hi Alice');
    const response = await inbox('owner');
    expect(response.status).toBe(200);
    expect((response.body as { content: MessageBody[] }).content.map(m => m.message)).toEqual(['Hi Alice', 'Welcome']);
  });
});

describe('read and delete', () => {
  it('lets the recipient mark a message as read, and nobody else', async () => {
    const message = (await send('admin', USERS.owner.sub, 'Read me')).body as MessageBody;
    expect((await request(e2e.server).patch(`/v1/user-messages/${message.id}/read`).set('Authorization', e2e.auth('admin'))).status).toBe(
      404,
    );
    const read = await request(e2e.server).patch(`/v1/user-messages/${message.id}/read`).set('Authorization', e2e.auth('owner'));
    expect(read.status).toBe(200);
    expect((read.body as MessageBody).readed).toEqual(expect.any(String));
  });

  it('lets the recipient delete a message, and nobody else', async () => {
    const message = (await send('other', USERS.owner.sub, 'Delete me')).body as MessageBody;
    expect((await request(e2e.server).delete(`/v1/user-messages/${message.id}`).set('Authorization', e2e.auth('other'))).status).toBe(404);
    expect((await request(e2e.server).delete(`/v1/user-messages/${message.id}`).set('Authorization', e2e.auth('owner'))).status).toBe(204);
    expect((await request(e2e.server).delete(`/v1/user-messages/${message.id}`).set('Authorization', e2e.auth('owner'))).status).toBe(404);
  });

  it('answers 404 for an unknown message', async () => {
    expect((await request(e2e.server).patch('/v1/user-messages/unknown/read').set('Authorization', e2e.auth('owner'))).status).toBe(404);
  });
});

// Spec 021, decision 2: the recipient (owner of the message), the sender, another user, an admin, a user without roles
// and no token, for each change.
describe('permission matrix', () => {
  it('sends with rmu-user (to a friend) or rmu-admin (to anybody) only', async () => {
    expect((await send('other', USERS.owner.sub)).status).toBe(201);
    expect((await send('admin', USERS.noRole.sub)).status).toBe(201);
    expect((await send('noRole', USERS.owner.sub)).status).toBe(403);
    expect(
      (await request(e2e.server).post('/v1/user-messages').send({ recipientId: USERS.owner.sub, message: 'Hi', type: 'info' })).status,
    ).toBe(401);
  });

  it.each([
    ['mark as read', (id: string) => request(e2e.server).patch(`/v1/user-messages/${id}/read`), 200],
    ['delete', (id: string) => request(e2e.server).delete(`/v1/user-messages/${id}`), 204],
  ] as const)('lets only the recipient %s: 404 to anybody else', async (_action, call, ok) => {
    const message = (await send('other', USERS.owner.sub, 'Matrix')).body as MessageBody;
    for (const user of ['other', 'admin', 'noRole'] as const)
      expect((await call(message.id).set('Authorization', e2e.auth(user))).status).toBe(404);
    expect((await call(message.id)).status).toBe(401);
    expect((await call(message.id).set('Authorization', e2e.auth('owner'))).status).toBe(ok);
  });

  it.skip('lists only the messages of the caller [F-users-08]', async () => {
    expect(ids((await inbox('noRole')).body)).toHaveLength(1);
    expect((await request(e2e.server).get('/v1/user-messages')).status).toBe(401);
  });
});
