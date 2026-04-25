import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGODB_URI);
let db;

export async function getDb() {
  if (!db) {
    await client.connect();
    db = client.db("safepath");
    await db.collection("shelters_dynamic").createIndex(
      { cachedAt: 1 },
      { expireAfterSeconds: 3600 }
    );
  }
  return db;
}