import { MongoClient, Db } from "mongodb";

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error(
    "MONGODB_URI is not set. Add it to your environment (Atlas connection string, mongodb+srv://...)."
  );
}

// Atlas `mongodb+srv://` URIs negotiate TLS by default. We set tls explicitly
// here anyway so the requirement is visible in code, not just implied by the
// connection string, and so it fails loudly if someone swaps in a non-TLS URI.
const options = {
  tls: true,
  // Keep a small pool — this app has low write volume (recruitment form).
  maxPoolSize: 10,
};

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  // Reuse the client across HMR reloads in dev.
  if (!global._mongoClientPromise) {
    const client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  const client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;

export async function getDb(): Promise<Db> {
  const client = await clientPromise;
  return client.db(process.env.MONGODB_DB_NAME || "layer8");
}
