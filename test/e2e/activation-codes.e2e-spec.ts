import request from 'supertest';
import { ids, provision, startApp, USERS, type E2eApp, type UserName } from './support/app.js';

type CodeBody = {
  id: string;
  code: string;
  owner: string;
  features: string[];
  createdAt: string;
  expiresAt?: string;
  activatedAt?: string | null;
  activatedBy?: string | null;
  version: number;
};

type PageBody<T> = { content: T[]; pagination: { page: number; size: number; totalElements: number } };

let e2e: E2eApp;

beforeAll(async () => {
  e2e = await startApp();
  await provision(e2e, 'owner', 'other', 'noRole');
});

afterAll(async () => {
  await e2e?.stop();
});

const create = (user: UserName, body: object = { features: ['core-law'] }) =>
  request(e2e.server).post('/v1/activation-codes').set('Authorization', e2e.auth(user)).send(body);

const createOne = async (body: object = { features: ['core-law'] }) => ((await create('admin', body)).body as CodeBody[])[0];

const post = (path: string, user: UserName, body: object) =>
  request(e2e.server).post(`/v1/activation-codes/${path}`).set('Authorization', e2e.auth(user)).send(body);

describe('create', () => {
  it('generates codes of the configured size for rmu-admin', async () => {
    const response = await create('admin', { features: ['core-law', 'spell-law'], count: 3, expiresAt: '2099-01-01T00:00:00.000Z' });
    expect(response.status).toBe(201);
    const codes = response.body as CodeBody[];
    expect(codes).toHaveLength(3);
    for (const code of codes) {
      expect(code.code).toMatch(/^[A-Z0-9]{8}$/);
      expect(code).toMatchObject({ owner: USERS.admin.sub, features: ['core-law', 'spell-law'], expiresAt: '2099-01-01T00:00:00.000Z' });
      expect(code.activatedAt).toBeNull();
    }
    expect(new Set(codes.map(code => code.code)).size).toBe(3);
  });

  it.each(['owner', 'noRole'] as const)('is forbidden to %s', async user => {
    expect((await create(user)).status).toBe(403);
  });

  it('requires a token', async () => {
    expect(
      (
        await request(e2e.server)
          .post('/v1/activation-codes')
          .send({ features: ['core-law'] })
      ).status,
    ).toBe(401);
  });

  it('rejects an unknown feature, more than 100 codes and an invalid date', async () => {
    expect((await create('admin', { features: ['dragon-law'] })).status).toBe(400);
    expect((await create('admin', { features: ['core-law'], count: 101 })).status).toBe(400);
    expect((await create('admin', { features: ['core-law'], expiresAt: 'tomorrow' })).status).toBe(400);
  });
});

describe('list', () => {
  it('is reserved to rmu-admin', async () => {
    expect((await request(e2e.server).get('/v1/activation-codes').set('Authorization', e2e.auth('owner'))).status).toBe(403);
    expect((await request(e2e.server).get('/v1/activation-codes').set('Authorization', e2e.auth('noRole'))).status).toBe(403);
  });

  it('lists every code with RSQL and paging', async () => {
    const spell = await createOne({ features: ['spell-law'] });
    const all = await request(e2e.server).get('/v1/activation-codes').set('Authorization', e2e.auth('admin'));
    expect(all.status).toBe(200);
    const total = (all.body as PageBody<CodeBody>).pagination.totalElements;
    expect(total).toBeGreaterThanOrEqual(4);

    const filtered = await request(e2e.server)
      .get('/v1/activation-codes')
      .query({ q: `code==${spell.code}` })
      .set('Authorization', e2e.auth('admin'));
    expect(ids(filtered.body)).toEqual([spell.id]);

    const page = await request(e2e.server).get('/v1/activation-codes').query({ page: 1, size: 2 }).set('Authorization', e2e.auth('admin'));
    expect((page.body as PageBody<CodeBody>).pagination).toMatchObject({ page: 1, size: 2, totalElements: total });
  });
});

describe('read, update and delete', () => {
  it('lets the admin that created a code read, change and delete it', async () => {
    const code = await createOne();
    const read = await request(e2e.server).get(`/v1/activation-codes/${code.id}`).set('Authorization', e2e.auth('admin'));
    expect(read.status).toBe(200);
    expect((read.body as CodeBody).code).toBe(code.code);

    const updated = await request(e2e.server)
      .patch(`/v1/activation-codes/${code.id}`)
      .set('Authorization', e2e.auth('admin'))
      .send({ features: ['treasure-law'], expiresAt: '2098-06-01T00:00:00.000Z' });
    expect(updated.status).toBe(200);
    expect(updated.body).toMatchObject({ features: ['treasure-law'], expiresAt: '2098-06-01T00:00:00.000Z', version: 1 });

    // A stale version is a 409; a PATCH that changes nothing keeps the version.
    const stale = await request(e2e.server)
      .patch(`/v1/activation-codes/${code.id}`)
      .set('Authorization', e2e.auth('admin'))
      .send({ features: ['core-law'], version: 0 });
    expect(stale.status).toBe(409);
    expect((stale.body as { code: string }).code).toBe('version-conflict');
    const same = await request(e2e.server)
      .patch(`/v1/activation-codes/${code.id}`)
      .set('Authorization', e2e.auth('admin'))
      .send({ features: ['treasure-law'], version: 1 });
    expect(same.status).toBe(200);
    expect((same.body as CodeBody).version).toBe(1);

    const deleted = await request(e2e.server).delete(`/v1/activation-codes/${code.id}`).set('Authorization', e2e.auth('admin'));
    // F-users-13: the OpenAPI document says 204, the endpoint answers 200 with an empty body.
    expect(deleted.status).toBe(200);
    expect((await request(e2e.server).get(`/v1/activation-codes/${code.id}`).set('Authorization', e2e.auth('admin'))).status).toBe(404);
  });

  it('hides a code from everybody but the admin that created it', async () => {
    const code = await createOne();
    const otherAdmin = { sub: 'e2e-admin-2', preferred_username: 'admin2', groups: ['rmu-admin'] };
    for (const user of ['owner', 'noRole'] as const) {
      expect((await request(e2e.server).get(`/v1/activation-codes/${code.id}`).set('Authorization', e2e.auth(user))).status).toBe(404);
      const patch = await request(e2e.server)
        .patch(`/v1/activation-codes/${code.id}`)
        .set('Authorization', e2e.auth(user))
        .send({ code: 'HACKED1' });
      expect(patch.status).toBe(404);
      expect((await request(e2e.server).delete(`/v1/activation-codes/${code.id}`).set('Authorization', e2e.auth(user))).status).toBe(404);
    }
    // F-users-10: another admin lists the code but cannot read, change or delete it.
    expect((await request(e2e.server).get(`/v1/activation-codes/${code.id}`).set('Authorization', e2e.auth(otherAdmin))).status).toBe(404);
  });

  it.skip('lets any rmu-admin read and delete a code [F-users-10]', async () => {
    const code = await createOne();
    const otherAdmin = { sub: 'e2e-admin-2', preferred_username: 'admin2', groups: ['rmu-admin'] };
    expect((await request(e2e.server).get(`/v1/activation-codes/${code.id}`).set('Authorization', e2e.auth(otherAdmin))).status).toBe(200);
  });

  it('answers 404 for an unknown code', async () => {
    expect((await request(e2e.server).get('/v1/activation-codes/unknown').set('Authorization', e2e.auth('admin'))).status).toBe(404);
  });
});

describe('check', () => {
  it('accepts a code that can be redeemed', async () => {
    const code = await createOne();
    const response = await post('check', 'noRole', { code: code.code });
    // F-users-14: POST /check and /activate answer 201 (the Nest default for POST), the OpenAPI document says 200.
    expect(response.status).toBe(201);
    expect((response.body as CodeBody).id).toBe(code.id);
  });

  it('rejects an unknown code (400), an expired one (400) and a malformed one (400)', async () => {
    expect((await post('check', 'owner', { code: 'NOPE0000' })).status).toBe(400);
    const expired = await createOne({ features: ['core-law'], expiresAt: '2000-01-01T00:00:00.000Z' });
    expect((await post('check', 'owner', { code: expired.code })).status).toBe(400);
    expect((await post('check', 'owner', { code: '$ne' })).status).toBe(400);
    expect((await post('check', 'owner', { code: { $ne: null } })).status).toBe(400);
  });
});

describe('activate', () => {
  it('redeems a code once, adds the user to the groups of its features and marks it used', async () => {
    const code = await createOne({ features: ['core-law', 'spell-law', 'treasure-law'] });
    const response = await post('activate', 'owner', { code: code.code });
    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({ id: code.id, activatedBy: USERS.owner.sub });
    expect((response.body as CodeBody).activatedAt).toEqual(expect.any(String));
    // treasure-law has no Keycloak group in the realm: it is skipped.
    expect(e2e.keycloak.assignments.filter(a => a.userId === USERS.owner.sub)).toEqual([
      { userId: USERS.owner.sub, groupId: 'g-core-law' },
      { userId: USERS.owner.sub, groupId: 'g-spell-law' },
    ]);

    expect((await post('activate', 'other', { code: code.code })).status).toBe(409);
    expect((await post('check', 'other', { code: code.code })).status).toBe(409);
  });

  it('answers 404 for an unknown code and 400 for an expired one', async () => {
    expect((await post('activate', 'owner', { code: 'NOPE0000' })).status).toBe(404);
    const expired = await createOne({ features: ['core-law'], expiresAt: '2000-01-01T00:00:00.000Z' });
    expect((await post('activate', 'owner', { code: expired.code })).status).toBe(400);
  });

  it('answers 404 to a user without a profile', async () => {
    const code = await createOne();
    const response = await post('activate', 'admin', { code: code.code });
    expect(response.status).toBe(404);
  });

  it('releases the code when the group assignment fails', async () => {
    const code = await createOne();
    e2e.keycloak.failGroupAssignment = true;
    try {
      const response = await post('activate', 'other', { code: code.code });
      expect(response.status).toBe(500);
    } finally {
      e2e.keycloak.failGroupAssignment = false;
    }
    expect((await post('check', 'other', { code: code.code })).status).toBe(201);
    expect((await post('activate', 'other', { code: code.code })).status).toBe(201);
  });

  it('lets a user without roles redeem a code', async () => {
    const code = await createOne();
    expect((await post('activate', 'noRole', { code: code.code })).status).toBe(201);
  });

  // F-users-12: clearing activatedAt leaves activatedBy, so the code stays used and cannot be redeemed again.
  it('keeps a code used after its activation date is cleared', async () => {
    const code = await createOne();
    await post('activate', 'owner', { code: code.code });
    const cleared = await request(e2e.server)
      .patch(`/v1/activation-codes/${code.id}`)
      .set('Authorization', e2e.auth('admin'))
      .send({ activatedAt: null });
    expect(cleared.status).toBe(200);
    expect(cleared.body).toMatchObject({ activatedAt: null, activatedBy: USERS.owner.sub });
    expect((await post('check', 'other', { code: code.code })).status).toBe(409);
  });

  // F-users-11: the value is only unique per owner. Another admin's code can take it (two codes, one value), and a
  // value taken by a code of the same admin is a duplicate key that answers 500.
  it('lets codes of two admins share a value, and answers 409 within one admin', async () => {
    const first = await createOne();
    const second = await createOne();
    const otherAdmin = { sub: 'e2e-admin-3', preferred_username: 'admin3', groups: ['rmu-admin'] };
    const foreign = (
      (
        await request(e2e.server)
          .post('/v1/activation-codes')
          .set('Authorization', e2e.auth(otherAdmin))
          .send({ features: ['core-law'] })
      ).body as CodeBody[]
    )[0];
    const shared = await request(e2e.server)
      .patch(`/v1/activation-codes/${foreign.id}`)
      .set('Authorization', e2e.auth(otherAdmin))
      .send({ code: first.code });
    expect(shared.status).toBe(200);

    const duplicate = await request(e2e.server)
      .patch(`/v1/activation-codes/${second.id}`)
      .set('Authorization', e2e.auth('admin'))
      .send({ code: first.code });
    // F-users-11: a 500 until phase 5, now the duplicate key is a 409.
    expect(duplicate.status).toBe(409);
    expect((duplicate.body as { code: string }).code).toBe('duplicate-key');
  });

  it.skip('rejects a code value that another code already has [F-users-11]', async () => {
    const first = await createOne();
    const second = await createOne();
    const response = await request(e2e.server)
      .patch(`/v1/activation-codes/${second.id}`)
      .set('Authorization', e2e.auth('admin'))
      .send({ code: first.code });
    expect(response.status).toBe(409);
  });
});
