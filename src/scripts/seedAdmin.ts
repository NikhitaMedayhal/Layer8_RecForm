import bcrypt from "bcryptjs";
import { MongoClient } from "mongodb";
import "dotenv/config";

async function main() {
  const [name, email, password] = process.argv.slice(2);

  if (!name || !email || !password) {
    console.error('Usage: npm run seed:admin -- "Name" email@example.com "password"');
    process.exit(1);
  }
  if (password.length < 10) {
    console.error("Password must be at least 10 characters.");
    process.exit(1);
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI not set");

  const client = new MongoClient(uri, { tls: true });
  await client.connect();
  const db = client.db(process.env.MONGODB_DB_NAME || "layer8");

  const passwordHash = await bcrypt.hash(password, 12);
  const emailLower = email.trim().toLowerCase();

  await db.collection("admins").updateOne(
    { email: emailLower },
    { $set: { name, email: emailLower, passwordHash, updatedAt: new Date() } },
    { upsert: true }
  );

  console.log(`Admin upserted: ${emailLower}`);
  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
