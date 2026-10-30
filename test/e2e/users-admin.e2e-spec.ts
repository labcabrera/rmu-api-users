import request from 'supertest';
import { provision, startApp, USERS, type E2eApp, type UserName } from './support/app.js';

type UserBody = { id: string; name: string; enabled: boolean; features: string[] };

let e2e: E2eApp;

beforeAll(async () => {
  e2e = await startApp();
  await provision(e2e, 'admin', 'owner', 'other');
});

afterAll(async () => {
  await e2e?.stop();
});

const as = (user: UserName) => e2e.auth(user);
const groupsOf = (userId: string) =>
  e2e.keycloak.assignments
    .filter(a => a.userId === userId)
    .map(a => a.groupId)
    .sort();

describe('user administration (spec 053)', () => {
  it('reads one user by id for administrators only', async () => {
    const response = await request(e2e.server).get(`/v1/users/${USERS.owner.sub}`).set('Authorization', as('admin'));
    expect(response.status).toBe(200);
    expect((response.body as UserBody).id).toBe(USERS.owner.sub);
    expect((await request(e2e.server).get(`/v1/users/${USERS.owner.sub}`).set('Authorization', as('other'))).status).toBe(403);
    expect((await request(e2e.server).get('/v1/users/nobody').set('Authorization', as('admin'))).status).toBe(404);
  });

  it('keeps /me and /search ahead of the id route', async () => {
    expect((await request(e2e.server).get('/v1/users/me').set('Authorization', as('other'))).status).toBe(200);
    expect((await request(e2e.server).get('/v1/users/search?name=a').set('Authorization', as('other'))).status).toBe(200);
  });

  it('adds and removes managed groups in Keycloak and copies them to the profile', async () => {
    const put = (groups: string[]) =>
      request(e2e.server).put(`/v1/users/${USERS.owner.sub}/groups`).set('Authorization', as('admin')).send({ groups });

    let response = await put(['rmu-user', 'rmu-core-law', 'rmu-spell-law']);
    expect(response.status).toBe(200);
    expect(groupsOf(USERS.owner.sub)).toEqual(['g-core-law', 'g-spell-law', 'g-user']);
    expect((response.body as UserBody).features).toEqual(['rmu-core-law', 'rmu-spell-law', 'rmu-user']);

    response = await put(['rmu-user', 'rmu-spell-law']);
    expect(groupsOf(USERS.owner.sub)).toEqual(['g-spell-law', 'g-user']);
    expect((response.body as UserBody).features).toEqual(['rmu-spell-law', 'rmu-user']);
  });

  it('validates the groups and forbids it to everybody else', async () => {
    const put = (user: UserName, groups: unknown) =>
      request(e2e.server).put(`/v1/users/${USERS.owner.sub}/groups`).set('Authorization', as(user)).send({ groups });
    expect((await put('admin', ['root'])).status).toBe(400);
    expect((await put('other', ['rmu-user'])).status).toBe(403);
  });

  it('does not let an administrator remove their own rmu-admin group or disable themselves', async () => {
    const groups = await request(e2e.server)
      .put(`/v1/users/${USERS.admin.sub}/groups`)
      .set('Authorization', as('admin'))
      .send({ groups: ['rmu-user'] });
    expect(groups.status).toBe(409);
    expect((groups.body as { code: string }).code).toBe('self-admin-removal');
    const disable = await request(e2e.server)
      .patch(`/v1/users/${USERS.admin.sub}`)
      .set('Authorization', as('admin'))
      .send({ enabled: false });
    expect(disable.status).toBe(409);
    expect((disable.body as { code: string }).code).toBe('self-disable');
  });

  it('disables and enables an account in Keycloak and in the profile', async () => {
    const patch = (enabled: unknown, user: UserName = 'admin') =>
      request(e2e.server).patch(`/v1/users/${USERS.other.sub}`).set('Authorization', as(user)).send({ enabled });
    const disabled = await patch(false);
    expect(disabled.status).toBe(200);
    expect((disabled.body as UserBody).enabled).toBe(false);
    expect((await patch(true)).body).toMatchObject({ enabled: true });
    expect(e2e.keycloak.enabledChanges.filter(c => c.userId === USERS.other.sub)).toEqual([
      { userId: USERS.other.sub, enabled: false },
      { userId: USERS.other.sub, enabled: true },
    ]);
    expect((await patch('no')).status).toBe(400);
    expect((await patch(false, 'owner')).status).toBe(403);
  });
});
