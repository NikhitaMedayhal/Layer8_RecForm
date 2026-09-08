import { createClient, type Client } from "@libsql/client";

declare global {
  // eslint-disable-next-line no-var
  var _tursoClient: Client | undefined;
}

// Lazily create (and cache) the client on first use, instead of at module
// import time. A bad/missing env var here should surface as a normal JSON
// error from the route that tried to use the DB — not as a crash during
// import that Next.js turns into a non-JSON 500 (which shows up on the
// frontend as a misleading "Network error").
function buildClient(): Client {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url) {
    throw new Error(
      "TURSO_DATABASE_URL is not set. Add it to your environment (e.g. libsql://<db-name>-<org>.turso.io)."
    );
  }
  if (!url.startsWith("libsql://") && !url.startsWith("file:")) {
    throw new Error(
      `TURSO_DATABASE_URL looks malformed: "${url}". Expected it to start with "libsql://" (or "file:" for local dev). Double-check for typos.`
    );
  }

  return createClient({
    url,
    // authToken is required for remote Turso databases; omit it only for a
    // local file:// url with no auth configured.
    authToken,
  });
}

export function getTurso(): Client {
  if (!global._tursoClient) {
    global._tursoClient = buildClient();
  }
  return global._tursoClient;
}

// Kept for existing `import { turso } from "@/lib/turso"` call sites — this
// still resolves lazily via the getter below, it just doesn't crash the
// module the moment it's imported if env vars are missing/bad.
//
// IMPORTANT: function properties (execute, batch, close, etc.) must be
// bound to the *real* client here, not left to bind to the Proxy at call
// time. @libsql/client's methods use private (#field) class members
// internally, and private fields aren't accessible through a Proxy — if
// you call `turso.execute(...)`, `this` defaults to the Proxy object,
// which throws "Cannot read private member ... from an object whose
// class did not declare it". Binding to `client` up front sidesteps that
// entirely.
export const turso: Client = new Proxy({} as Client, {
  get(_target, prop, _receiver) {
    const client = getTurso();
    const value = Reflect.get(client, prop, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});

export default turso;