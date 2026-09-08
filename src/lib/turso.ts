import { createClient, type Client } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  throw new Error(
    "TURSO_DATABASE_URL is not set. Add it to your environment (e.g. libsql://<db-name>-<org>.turso.io)."
  );
}

declare global {
  // eslint-disable-next-line no-var
  var _tursoClient: Client | undefined;
}

// Reuse the client across HMR reloads in dev and across invocations elsewhere.
export const turso: Client =
  global._tursoClient ??
  createClient({
    url,
    // authToken is required for remote Turso databases; omit it only for a
    // local file:// url with no auth configured.
    authToken,
  });

if (process.env.NODE_ENV === "development") {
  global._tursoClient = turso;
}

export default turso;
