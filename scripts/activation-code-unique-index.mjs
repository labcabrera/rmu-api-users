#!/usr/bin/env node
// Spec 021, decision 5 (F-users-11): the value of an activation code becomes unique across owners.
//
// Lists the code values that more than one activation code shares (a code of each admin could take the same value
// before, the unique index was owner + code) and, outside a dry run, replaces the indexes on `code` with one unique
// index. With duplicates it changes nothing and exits with 1: they have to be resolved by hand first (delete or
// change the extra codes, keeping the one that was redeemed).
//
// Usage, with the connection string of the users database in the environment (the script never reads .env):
//
//   RMU_MONGO_USERS_URI='mongodb://<user>:<password>@<host>:27017/rmu-users?authSource=admin' DRY_RUN=1 \
//     node scripts/activation-code-unique-index.mjs
//
// DRY_RUN=1 only reports (duplicates and current indexes). Without it the script also creates the index, and is
// idempotent: once the unique index exists it does nothing.
import mongoose from 'mongoose';

const COLLECTION = 'activation-codes';
const UNIQUE_INDEX = 'code_1';
const OLD_INDEXES = ['owner_1_code_1'];

const uri = process.env.RMU_MONGO_USERS_URI;
if (!uri) {
  console.error('RMU_MONGO_USERS_URI is not set: export the connection string of the users database first.');
  process.exit(2);
}
const dryRun = ['1', 'true'].includes(process.env.DRY_RUN ?? '');

await mongoose.connect(uri, { autoIndex: false, autoCreate: false, serverSelectionTimeoutMS: 10_000 });
let exitCode = 0;
try {
  const db = mongoose.connection.db;
  const exists = (await db.listCollections({ name: COLLECTION }, { nameOnly: true }).toArray()).length > 0;
  console.log(`Database ${db.databaseName}, collection ${COLLECTION}${exists ? '' : ' (missing)'}${dryRun ? ' (dry run)' : ''}`);
  if (!exists) {
    console.log('Nothing to do: the API creates the unique index together with the collection.');
  } else {
    const collection = db.collection(COLLECTION);
    const duplicates = await collection
      .aggregate([
        { $group: { _id: '$code', count: { $sum: 1 }, codes: { $push: { id: '$_id', owner: '$owner', activatedBy: '$activatedBy' } } } },
        { $match: { count: { $gt: 1 } } },
        { $sort: { _id: 1 } },
      ])
      .toArray();
    console.log(`Duplicate code values: ${duplicates.length}`);
    for (const duplicate of duplicates) {
      const codes = duplicate.codes.map(c => `${c.id} (owner ${c.owner}${c.activatedBy ? `, redeemed by ${c.activatedBy}` : ''})`);
      console.log(`  ${duplicate._id}: ${codes.join(', ')}`);
    }
    const indexes = await collection.indexes();
    console.log(`Indexes: ${indexes.map(index => `${index.name}${index.unique ? ' (unique)' : ''}`).join(', ')}`);
    const unique = indexes.find(index => index.name === UNIQUE_INDEX && index.unique);

    if (duplicates.length > 0) {
      console.log('Resolve the duplicates before creating the unique index.');
      exitCode = 1;
    } else if (unique) {
      console.log(`The unique index ${UNIQUE_INDEX} already exists.`);
    } else if (dryRun) {
      console.log(
        `Would replace ${[UNIQUE_INDEX, ...OLD_INDEXES].filter(n => indexes.some(i => i.name === n)).join(', ') || 'no index'} with a unique ${UNIQUE_INDEX}.`,
      );
    } else {
      for (const name of [UNIQUE_INDEX, ...OLD_INDEXES]) {
        if (indexes.some(index => index.name === name)) {
          await collection.dropIndex(name);
          console.log(`Dropped ${name}`);
        }
      }
      await collection.createIndex({ code: 1 }, { unique: true, name: UNIQUE_INDEX });
      console.log(`Created the unique index ${UNIQUE_INDEX}`);
    }
  }
} finally {
  await mongoose.disconnect();
}
process.exit(exitCode);
