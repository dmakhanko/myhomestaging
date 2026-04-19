import { MongoClient, GridFSBucket } from "mongodb";

const dbName = process.env.DB_NAME || "homestaging";

let clientPromise;

function getClientPromise() {
  if (clientPromise) return clientPromise;

  const uri = process.env.MONGO_URL;
  if (!uri) throw new Error("MONGO_URL is not defined");

  if (process.env.NODE_ENV === "development") {
    // Reuse connection across HMR reloads in dev
    if (!global._mongoClientPromise) {
      global._mongoClientPromise = new MongoClient(uri).connect();
    }
    clientPromise = global._mongoClientPromise;
  } else {
    clientPromise = new MongoClient(uri).connect();
  }

  return clientPromise;
}

export async function getDb() {
  const client = await getClientPromise();
  return client.db(dbName);
}

export async function getGridFSBucket() {
  const db = await getDb();
  return new GridFSBucket(db, { bucketName: "site_media" });
}
