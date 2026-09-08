import { createClient } from "@libsql/client";
import { config } from "dotenv";

// See the comment in seedAdmin.ts — same reasoning applies here.
config({ path: ".env" });
config({ path: ".env.local", override: true });

async function main() {
  const [email] = process.argv.slice(2);

  if (!email) {
    console.error("Usage: npm run remove:admin -- email@example.com");
    process.exit(1);
  }

  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url) throw new Error("TURSO_DATABASE_URL not set");

  const client = createClient({ url, authToken });
  const emailLower = email.trim().toLowerCase();

  const existing = await client.execute({
    sql: "SELECT id, name FROM admins WHERE email = ? LIMIT 1",
    args: [emailLower],
  });

  if (existing.rows.length === 0) {
    console.error(`No admin found with email: ${emailLower}`);
    client.close();
    process.exit(1);
  }

  // Refuse to remove the last remaining admin — that would lock everyone
  // out of /admin with no way back in short of touching the database
  // directly.
  const countResult = await client.execute("SELECT COUNT(*) as count FROM admins");
  const totalAdmins = Number(countResult.rows[0].count);
  if (totalAdmins <= 1) {
    console.error(
      "Refusing to remove the last admin account. Create another admin first (npm run seed:admin) if you really want to remove this one."
    );
    client.close();
    process.exit(1);
  }

  await client.execute({
    sql: "DELETE FROM admins WHERE email = ?",
    args: [emailLower],
  });

  await client.execute({
    sql: `INSERT INTO audit_log (actorEmail, action, detail, ip) VALUES (?, 'admin_removed', ?, ?)`,
    args: ["cli", `Removed admin: ${emailLower}`, "local-cli"],
  });

  console.log(`Admin removed: ${emailLower}`);
  client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});