import bcrypt from "bcryptjs";
import { createClient } from "@libsql/client";
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

  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url) throw new Error("TURSO_DATABASE_URL not set");

  const client = createClient({ url, authToken });

  const passwordHash = await bcrypt.hash(password, 12);
  const emailLower = email.trim().toLowerCase();

  // Upsert: update the existing admin's name/password if the email already
  // exists, otherwise insert a new row.
  await client.execute({
    sql: `INSERT INTO admins (name, email, passwordHash, updatedAt)
          VALUES (?, ?, ?, datetime('now'))
          ON CONFLICT(email) DO UPDATE SET
            name = excluded.name,
            passwordHash = excluded.passwordHash,
            updatedAt = datetime('now')`,
    args: [name, emailLower, passwordHash],
  });

  console.log(`Admin upserted: ${emailLower}`);
  client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
