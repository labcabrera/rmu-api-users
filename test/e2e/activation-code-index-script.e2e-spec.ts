import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

// scripts/activation-code-unique-index.mjs (spec 021, decision 5; F-users-11), run against an in-memory Mongo.
const run = promisify(execFile);
const SCRIPT = 'scripts/activation-code-unique-index.mjs';

let mongo: MongoMemoryServer;
let uri: string;
let connection: mongoose.Connection;

const script = async (env: Record<string, string>) => {
  try {
    const { stdout } = await run(process.execPath, [SCRIPT], { env: { PATH: process.env.PATH, ...env } });
    return { code: 0, stdout };
  } catch (error) {
    const failure = error as { code: number; stdout: string; stderr: string };
    return { code: failure.code, stdout: failure.stdout + failure.stderr };
  }
};

const codes = () => connection.collection('activation-codes');

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  uri = mongo.getUri('rmu-users-script');
  connection = await mongoose.createConnection(uri).asPromise();
});

afterAll(async () => {
  await connection?.close();
  await mongo?.stop();
});

describe('activation-code-unique-index script', () => {
  it('needs the connection string in the environment', async () => {
    const result = await script({});
    expect(result.code).toBe(2);
    expect(result.stdout).toContain('RMU_MONGO_USERS_URI is not set');
  });

  it('does nothing without the collection', async () => {
    const result = await script({ RMU_MONGO_USERS_URI: uri });
    expect(result.code).toBe(0);
    expect(result.stdout).toContain('(missing)');
  });

  it('lists the duplicates in a dry run and refuses to create the index while they exist', async () => {
    await codes().createIndex({ code: 1 }, { name: 'code_1' });
    await codes().createIndex({ owner: 1, code: 1 }, { unique: true, name: 'owner_1_code_1' });
    await codes().insertMany([
      { _id: 'c-1', code: 'SAME0001', owner: 'admin-1', activatedBy: 'u-1' } as never,
      { _id: 'c-2', code: 'SAME0001', owner: 'admin-2' } as never,
      { _id: 'c-3', code: 'ONLY0001', owner: 'admin-1' } as never,
    ]);

    const dry = await script({ RMU_MONGO_USERS_URI: uri, DRY_RUN: '1' });
    expect(dry.stdout).toContain('Duplicate code values: 1');
    expect(dry.stdout).toContain('SAME0001: c-1 (owner admin-1, redeemed by u-1), c-2 (owner admin-2)');
    expect(dry.code).toBe(1);

    const real = await script({ RMU_MONGO_USERS_URI: uri });
    expect(real.code).toBe(1);
    expect((await codes().indexes()).map(index => index.name)).toEqual(['_id_', 'code_1', 'owner_1_code_1']);
  });

  it('replaces the old indexes with a unique one once the duplicates are gone, and is idempotent', async () => {
    await codes().deleteOne({ _id: 'c-2' } as never);

    const dry = await script({ RMU_MONGO_USERS_URI: uri, DRY_RUN: '1' });
    expect(dry.code).toBe(0);
    expect(dry.stdout).toContain('Would replace code_1, owner_1_code_1 with a unique code_1');
    expect((await codes().indexes()).find(index => index.name === 'code_1')?.unique).toBeUndefined();

    const real = await script({ RMU_MONGO_USERS_URI: uri });
    expect(real.code).toBe(0);
    expect((await codes().indexes()).map(index => [index.name, index.unique ?? false])).toEqual([
      ['_id_', false],
      ['code_1', true],
    ]);

    const again = await script({ RMU_MONGO_USERS_URI: uri });
    expect(again.stdout).toContain('The unique index code_1 already exists');
  });
});
