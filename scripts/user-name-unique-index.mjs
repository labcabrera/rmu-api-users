#!/usr/bin/env node
// The display name of a user is unique ignoring case (`name_1`, collation en/2), but Mongoose does not create the
// index when the collection already holds duplicates, or when an index with that name already exists without the
// collation. A database with a duplicate name then resolves a friendship request by name to either user.
//
// Lists the names that more than one user shares and, outside a dry run, renames every duplicate but the one that
// logged in last with the suffix the API uses for collisions (`-2`, `-3`...), then replaces `name_1` with the unique
// collated index.
//
// Usage, with the connection string of the users database in the environment (the script never reads .env):
//
//   RMU_MONGO_USERS_URI='mongodb://<user>:<password>@<host>:27017/rmu-users?authSource=admin' DRY_RUN=1 \
//     node scripts/user-name-unique-index.mjs
//
// DRY_RUN=1 only reports (duplicates, planned names and current indexes). Without it the script renames and creates
// the index, and is idempotent: with no duplicates and the unique index in place it does nothing.
import mongoose from 'mongoose';

const COLLECTION = 'users';
const UNIQUE_INDEX = 'name_1';
const COLLATION = { locale: 'en', strength: 2 };

const uri = process.env.RMU_MONGO_USERS_URI;
if (!uri) {
  console.error('RMU_MONGO_USERS_URI is not set: export the connection string of the users database first.');
  process.exit(2);
}
const dryRun = ['1', 'true'].includes(process.env.DRY_RUN ?? '');

await mongoose.connect(uri, { autoIndex: false, autoCreate: false, serverSelectionTimeoutMS: 10_000 });
try {
  const db = mongoose.connection.db;
  const exists = (await db.listCollections({ name: COLLECTION }, { nameOnly: true }).toArray()).length > 0;
  console.log(`Database ${db.databaseName}, collection ${COLLECTION}${exists ? '' : ' (missing)'}${dryRun ? ' (dry run)' : ''}`);
  if (exists) {
    const collection = db.collection(COLLECTION);
    const duplicates = await collection
      .aggregate(
        [
          { $sort: { lastLoginAt: -1, createdAt: -1 } },
          { $group: { _id: '$name', count: { $sum: 1 }, users: { $push: { id: '$_id', name: '$name', lastLoginAt: '$lastLoginAt' } } } },
          { $match: { count: { $gt: 1 } } },
        ],
        { collation: COLLATION },
      )
      .toArray();
    console.log(`Duplicate names: ${duplicates.length}`);

    const taken = async name => (await collection.countDocuments({ name }, { collation: COLLATION })) > 0;
    const planned = new Set();
    for (const duplicate of duplicates) {
      const [kept, ...others] = duplicate.users;
      console.log(`  ${kept.name}: keeps ${kept.id} (last login ${kept.lastLoginAt ?? 'never'})`);
      for (const user of others) {
        let attempt = 2;
        let candidate = `${user.name}-${attempt}`;
        while ((await taken(candidate)) || planned.has(candidate.toLowerCase())) candidate = `${user.name}-${++attempt}`;
        planned.add(candidate.toLowerCase());
        console.log(`    ${user.id} (last login ${user.lastLoginAt ?? 'never'}) -> ${candidate}`);
        if (!dryRun)
          await collection.updateOne({ _id: user.id }, { $set: { name: candidate, updatedAt: new Date() }, $inc: { version: 1 } });
      }
    }

    const indexes = await collection.indexes();
    console.log(
      `Indexes: ${indexes.map(index => `${index.name}${index.unique ? ' (unique)' : ''}${index.collation ? ' (collated)' : ''}`).join(', ')}`,
    );
    const current = indexes.find(index => index.name === UNIQUE_INDEX);
    const ready = current?.unique && current.collation?.locale === COLLATION.locale && current.collation?.strength === COLLATION.strength;
    if (ready) {
      console.log(`The unique index ${UNIQUE_INDEX} already exists.`);
    } else if (dryRun) {
      console.log(`Would ${current ? 'replace' : 'create'} the unique collated index ${UNIQUE_INDEX}.`);
    } else {
      if (current) {
        await collection.dropIndex(UNIQUE_INDEX);
        console.log(`Dropped ${UNIQUE_INDEX}`);
      }
      await collection.createIndex({ name: 1 }, { unique: true, collation: COLLATION, name: UNIQUE_INDEX });
      console.log(`Created the unique index ${UNIQUE_INDEX}`);
    }
  }
} finally {
  await mongoose.disconnect();
}
