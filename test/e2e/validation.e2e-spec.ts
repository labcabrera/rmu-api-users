import request from 'supertest';
import { provision, startApp, type E2eApp, type UserName } from './support/app.js';

// Spec 044, fallo 10: the body is validated as sent (no implicit conversion); the query converts page and size itself.
// No body of users has a boolean field.
describe('explicit conversion', () => {
  let e2e: E2eApp;

  const send = (method: 'post' | 'patch', user: UserName, path: string, body: object) =>
    request(e2e.server)[method](path).set('Authorization', e2e.auth(user)).send(body);
  const get = (user: UserName, path: string) => request(e2e.server).get(path).set('Authorization', e2e.auth(user));

  beforeAll(async () => {
    e2e = await startApp();
    await provision(e2e, 'owner', 'admin');
  });

  afterAll(async () => {
    await e2e?.stop();
  });

  it('rejects a number in a string field', async () => {
    const response = await send('patch', 'owner', '/v1/users/me', { name: 42 });
    expect(response.status).toBe(400);
    expect((response.body as { message: string[] }).message).toContain('name must be a string');
    expect((await send('post', 'owner', '/v1/friendships', { addresseeName: 42 })).status).toBe(400);
    expect((await send('patch', 'owner', '/v1/users/me', { imageUrl: 7 })).status).toBe(400);
  });

  it('rejects a string in a number field', async () => {
    const response = await send('post', 'admin', '/v1/activation-codes', { features: ['core-law'], count: '2' });
    expect(response.status).toBe(400);
    expect((response.body as { message: string[] }).message).toContain('count must be an integer number');
  });

  it('still converts page and size from the query', async () => {
    const listings: [UserName, string][] = [
      ['admin', '/v1/users'],
      ['owner', '/v1/users/search?name=a&'],
      ['owner', '/v1/friendships'],
      ['owner', '/v1/user-messages'],
      ['admin', '/v1/activation-codes'],
    ];
    for (const [user, path] of listings) {
      const base = path.includes('?') ? path : `${path}?`;
      const response = await get(user, `${base}page=0&size=20`);
      expect(response.status, path).toBe(200);
      expect((response.body as { pagination: unknown }).pagination, path).toMatchObject({ page: 0, size: 20 });
      expect((await get(user, `${base}size=abc`)).status, path).toBe(400);
    }
  });
});
