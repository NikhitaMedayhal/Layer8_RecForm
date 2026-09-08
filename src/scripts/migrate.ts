import { config } from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@libsql/client";

// See the comment in seedAdmin.ts — same reasoning applies here.
config({ path: ".env" });
config({ path: ".env.local", override: true });

async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url) throw new Error("TURSO_DATABASE_URL not set");

  const client = createClient({ url, authToken });

  const schemaPath = path.join(process.cwd(), "src/lib/schema.sql");
  const rawSql = fs.readFileSync(schemaPath, "utf8");

  // Strip full-line and trailing `--` comments before splitting on `;`.
  // The split below is a naive statement separator — without this, a
  // semicolon typed inside a comment (e.g. plain English prose) gets
  // mistaken for the end of a SQL statement, chopping things up wrong.
  const sql = rawSql
    .split("\n")
    .map((line) => {
      const commentIndex = line.indexOf("--");
      return commentIndex === -1 ? line : line.slice(0, commentIndex);
    })
    .join("\n");

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