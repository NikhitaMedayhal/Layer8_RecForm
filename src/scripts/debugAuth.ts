import bcrypt from "bcryptjs";
import { createClient } from "@libsql/client";
import { config } from "dotenv";

// Same env loading order as seedAdmin.ts / migrate.ts, so this connects to
// whichever DB those two scripts actually wrote to / migrated.
config({ path: ".env" });
config({ path: ".env.local", override: true });

async function main() {
  const [email, password] = process.argv.slice(2);

  if (!email || !password) {
    console.error('Usage: npx tsx src/scripts/debugAuth.ts "email@example.com" "password"');
    process.exit(1);
  }

  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url) throw new Error("TURSO_DATABASE_URL not set");

  console.log(`Connecting to: ${url}`);
  console.log(`Auth token present: ${authToken ? "yes" : "no"}`);

  const client = createClient({ url, authToken });
  const emailLower = email.trim().toLowerCase();

  const result = await client.execute({
    sql: "SELECT id, name, email, passwordHash, length(email) as emailLen, length(passwordHash) as hashLen FROM admins WHERE email = ?",
    args: [emailLower],
  });

  console.log(`\nLooked up email: "${emailLower}" (length ${emailLower.length})`);
  console.log(`Rows found: ${result.rows.length}`);

  if (result.rows.length === 0) {
    console.log("\nNo admin row matches that email in THIS database.");
    console.log("Dumping all admin emails currently in the table:");
    const all = await client.execute("SELECT email, length(email) as len FROM admins");
    for (const row of all.rows) {
      console.log(`  - "${row.email}" (length ${row.len})`);
    }
    client.close();
    return;
  }

  const admin = result.rows[0];
  console.log(`Matched row: id=${admin.id}, name=${admin.name}, email="${admin.email}" (len ${admin.emailLen}), hash length=${admin.hashLen}`);

  const valid = await bcrypt.compare(password, String(admin.passwordHash));
  console.log(`\nPassword you supplied: "${password}" (length ${password.length})`);
  console.log(valid ? "✅ bcrypt.compare: MATCH" : "❌ bcrypt.compare: NO MATCH");

  client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});