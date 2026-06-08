// Shared test setup: spin up an in-memory MongoDB, expose a clean
// connection helper, and clean up between tests.
//
// Requires `mongodb-memory-server` to be installed:
//   npm install --save-dev mongodb-memory-server
//
// If unavailable, the test files fall back to a "skip if no mongo" path.

import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let mongo = null;

export const connectTestDB = async () => {
  if (mongo) return mongoose.connection;
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();
  await mongoose.connect(uri);
  return mongoose.connection;
};

export const disconnectTestDB = async () => {
  await mongoose.disconnect();
  if (mongo) {
    await mongo.stop();
    mongo = null;
  }
};

export const clearTestDB = async () => {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
};
