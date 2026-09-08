import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@libsql/client";

async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url) throw new Error("TURSO_DATABASE_URL not set");

  const client = createClient({ url, authToken });

  const schemaPath = path.join(process.cwd(), "src/lib/schema.sql");
  const sql = fs.readFileSync(schemaPath, "utf8");

  // Split on semicolons so each CREATE statement runs separately
  // (libSQL's execute() takes one statement at a time).
  const statements = sql
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);

  for (const statement of statements) {
    await client.execute(statement);
  }

  console.log(`Migration applied: ${statements.length} statement(s) run against ${url}`);
  client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
