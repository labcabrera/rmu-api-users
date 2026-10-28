#!/usr/bin/env node
// Spec 044, decision 9 (F-users-28): a blocked friendship records who blocked it (`blockedBy`), and only that user can
// delete the block.
//
// Before the change only the addressee could block (PATCH), so every friendship already blocked takes
// `blockedBy = addresseeId`. Friendships that are not blocked get no `blockedBy` (the API reads a missing one as null).
//
// Usage, with the connection string of the users database in the environment (the script never reads .env):
//
//   RMU_MONGO_USERS_URI='mongodb://<user>:<password>@<host>:27017/rmu-users?authSource=admin' DRY_RUN=1 \
//     node scripts/friendship-blocked-by.mjs
//
// DRY_RUN=1 only reports how many blocked friendships lack `blockedBy`. Without it the script also sets it. It is
// idempotent: a friendship that already has `blockedBy` is never changed.
import mongoose from 'mongoose';

const COLLECTION = 'friendship';
const PENDING = { status: 'blocked', $or: [{ blockedBy: { $exists: false } }, { blockedBy: null }] };

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
  if (!exists) {
    console.log('Nothing to do: there are no friendships.');
  } else {
    const collection = db.collection(COLLECTION);
    const blocked = await collection.countDocuments({ status: 'blocked' });
    const pending = await collection.find(PENDING, { projection: { _id: 1, requesterId: 1, addresseeId: 1 } }).toArray();
    console.log(`Blocked friendships: ${blocked}, without blockedBy: ${pending.length}`);
    for (const friendship of pending) {
      console.log(`  ${friendship._id}: requester ${friendship.requesterId}, addressee ${friendship.addresseeId}`);
    }
    if (pending.length === 0) {
      console.log('Nothing to do.');
    } else if (dryRun) {
      console.log(`Would set blockedBy = addresseeId on ${pending.length} friendship(s).`);
    } else {
      // An update pipeline copies the field of each document; the version is not touched (a data fix, not a change).
      const result = await collection.updateMany(PENDING, [{ $set: { blockedBy: '$addresseeId' } }]);
      console.log(`Set blockedBy = addresseeId on ${result.modifiedCount} friendship(s).`);
    }
  }
} finally {
  await mongoose.disconnect();
}
