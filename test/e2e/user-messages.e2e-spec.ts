import request from 'supertest';
import { ids, startApp, USERS, type E2eApp, type UserName } from './support/app.js';

type MessageBody = { id: string; userId: string; from: string; message: string; type: string; readed: string | null; createdAt: string };

let e2e: E2eApp;

beforeAll(async () => {
  e2e = await startApp();
});

afterAll(async () => {
  await e2e?.stop();
});

const send = (user: UserName, recipientId: string, message = 'Hello', type = 'info') =>
  request(e2e.server).post('/v1/user-messages').set('Authorization', e2e.auth(user)).send({ recipientId, message, type });

const inbox = (user: UserName) => request(e2e.server).get('/v1/user-messages').set('Authorization', e2e.auth(user));

describe('send', () => {
  it('stores a message from the caller to the recipient', async () => {
    const response = await send('owner', USERS.other.sub, 'Hi Bob', 'alert');
    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({ userId: USERS.other.sub, from: USERS.owner.sub, message: 'Hi Bob', type: 'alert', readed: null });
  });

  // F-users-09: any authenticated user, even without roles, sends to any id, including one that is no user at all.
  it('accepts a message from a user without roles to an unknown recipient', async () => {
    expect((await send('noRole', 'no-such-user')).status).toBe(201);
  });

  it.skip('rejects a message to an unknown recipient [F-users-09]', async () => {
    expect((await send('owner', 'no-such-user')).status).toBe(404);
  });

  it('rejects an unknown type, a missing recipient and a message over 1000 characters', async () => {
    expect((await send('owner', USERS.other.sub, 'Hi', 'spam')).status).toBe(400);
    expect(
      (await request(e2e.server).post('/v1/user-messages').set('Authorization', e2e.auth('owner')).send({ message: 'Hi', type: 'info' }))
        .status,
    ).toBe(400);
    expect((await send('owner', USERS.other.sub, 'x'.repeat(1001))).status).toBe(400);
  });

  it('requires a token', async () => {
    expect((await request(e2e.server).post('/v1/user-messages').send({ recipientId: 'x', message: 'Hi', type: 'info' })).status).toBe(401);
  });
});

describe('inbox', () => {
  // F-users-08: the query filters on recipientId, a field the messages do not have (they store userId), so the inbox
  // is always empty. The q parameter is ignored.
  it('lists no message, not even the unread ones of the caller', async () => {
    await send('admin', USERS.owner.sub, 'Welcome');
    const response = await inbox('owner');
    expect(response.status).toBe(200);
    expect(ids(response.body)).toEqual([]);
  });

  it.skip('lists the unread messages of the caller, newest first [F-users-08]', async () => {
    const response = await inbox('owner');
    expect((response.body as { content: MessageBody[] }).content.map(m => m.message)).toEqual(['Welcome']);
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
