import request from 'supertest';
import type { UsersApiStats } from '../../src/modules/stats/domain/users-api-stats.js';
import { startApp, type E2eApp } from './support/app.js';

const NOW = new Date();
const monthsAgo = (months: number) => new Date(Date.UTC(NOW.getUTCFullYear(), NOW.getUTCMonth() - months, 2));
const month = (date: Date) => date.toISOString().slice(0, 7);

let e2e: E2eApp;

beforeAll(async () => {
  e2e = await startApp();
  const db = e2e.connection;
  await db.collection('users').insertMany([
    { _id: 'u1', username: 'a', createdAt: NOW, lastLoginAt: NOW },
    { _id: 'u2', username: 'b', createdAt: monthsAgo(2), lastLoginAt: monthsAgo(2) },
    { _id: 'u3', username: 'c', createdAt: monthsAgo(24), lastLoginAt: null },
  ] as never[]);
  const yesterday = new Date(NOW.getTime() - 24 * 60 * 60 * 1000);
  await db.collection('activation-codes').insertMany([
    { _id: 'a1', code: 'A1', createdAt: NOW, activatedAt: null },
    { _id: 'a2', code: 'A2', createdAt: NOW, activatedAt: null, expiresAt: yesterday },
    { _id: 'a3', code: 'A3', createdAt: NOW, activatedAt: yesterday, expiresAt: yesterday },
  ] as never[]);
});

afterAll(async () => {
  await e2e?.stop();
});

const stats = (body: unknown) => body as UsersApiStats;

describe('GET /v1/stats (spec 053)', () => {
  it('counts by status and by month of creation for an administrator', async () => {
    const response = await request(e2e.server).get('/v1/stats').set('Authorization', e2e.auth('admin'));
    expect(response.status).toBe(200);
    const body = stats(response.body);
    expect(body.users).toMatchObject({ total: 3, active: 1, newThisMonth: 1 });
    expect(body.users.createdByMonth).toHaveLength(12);
    expect(body.users.createdByMonth.at(-1)).toEqual({ month: month(NOW), count: 1 });
    expect(body.users.createdByMonth.find(entry => entry.month === month(monthsAgo(2)))?.count).toBe(1);
    expect(body.activationCodes).toEqual({ total: 3, free: 1, used: 1, expired: 1 });
  });

  it('is forbidden to a user who is not an administrator', async () => {
    const response = await request(e2e.server).get('/v1/stats').set('Authorization', e2e.auth('owner'));
    expect(response.status).toBe(403);
  });

  it('requires a token', async () => {
    expect((await request(e2e.server).get('/v1/stats')).status).toBe(401);
  });
});
