import request from 'supertest';
import { startApp, type E2eApp } from './support/app.js';

// The OpenAPI document: /api-spec as in the other APIs (spec 020), and /api-docs-json as before.
describe('OpenAPI', () => {
  let e2e: E2eApp;

  beforeAll(async () => {
    e2e = await startApp();
  });

  afterAll(async () => {
    await e2e?.stop();
  });

  it('serves the same document at /api-spec and /api-docs-json without a token', async () => {
    const spec = await request(e2e.server).get('/api-spec');
    const legacy = await request(e2e.server).get('/api-docs-json');
    expect(spec.status).toBe(200);
    expect(legacy.status).toBe(200);
    expect(spec.body).toEqual(legacy.body);
    const paths = Object.keys((spec.body as { paths: object }).paths);
    expect(paths).toEqual(
      expect.arrayContaining(['/v1/users/me', '/v1/users/search', '/v1/activation-codes', '/v1/friendships', '/v1/user-messages']),
    );
  });

  type Operation = { security?: unknown[]; responses?: Record<string, { content?: Record<string, { schema?: unknown }> }> };
  const operations = async () => {
    const spec = (await request(e2e.server).get('/api-spec')).body as { paths: Record<string, Record<string, Operation>> };
    return spec.paths;
  };

  it('documents the health check without security and every other operation with it', async () => {
    const paths = await operations();
    expect(paths['/v1/health'].get.security).toBeUndefined();
    for (const [path, methods] of Object.entries(paths)) {
      if (path === '/v1/health') continue;
      for (const operation of Object.values(methods)) expect(operation.security).toEqual([{ oauth2: [], 'access-token': [] }]);
    }
  });

  it('documents the error body with an example of this API', async () => {
    const spec = (await request(e2e.server).get('/api-spec')).body as {
      components: { schemas: { ErrorDto: { properties: Record<string, { example?: unknown }> } } };
    };
    expect(spec.components.schemas.ErrorDto.properties.path.example).toMatch(/^\/v1\/friendships\//);
  });

  it('documents every field of a friendship [F-users-19]', async () => {
    const spec = (await request(e2e.server).get('/api-spec')).body as {
      components: { schemas: { FriendshipDto: { properties: Record<string, unknown>; required: string[] } } };
    };
    const fields = [
      'id',
      'requesterId',
      'requesterName',
      'addresseeId',
      'addresseeName',
      'status',
      'message',
      'createdAt',
      'updatedAt',
      'version',
    ];
    expect(Object.keys(spec.components.schemas.FriendshipDto.properties).sort()).toEqual([...fields].sort());
  });

  it('documents the success status that each endpoint answers [F-users-13, F-users-14]', async () => {
    const paths = await operations();
    const statuses = (path: string, method: string) => Object.keys(paths[path][method].responses ?? {}).filter(s => s.startsWith('2'));
    expect(statuses('/v1/activation-codes/check', 'post')).toEqual(['200']);
    expect(statuses('/v1/activation-codes/activate', 'post')).toEqual(['200']);
    expect(statuses('/v1/activation-codes/{id}', 'delete')).toEqual(['204']);
    expect(statuses('/v1/activation-codes', 'post')).toEqual(['201']);
    expect(statuses('/v1/friendships/{id}', 'delete')).toEqual(['204']);
    expect(statuses('/v1/user-messages/{id}', 'delete')).toEqual(['204']);
  });

  it('serves the Swagger UI', async () => {
    const response = await request(e2e.server).get('/api-docs/');
    expect(response.status).toBe(200);
    expect(response.text).toContain('swagger');
  });
});
