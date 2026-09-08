-- Layer8 recruitment form schema (Turso / libSQL)

CREATE TABLE IF NOT EXISTS admins (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  passwordHash TEXT NOT NULL,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS applications (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  fullName TEXT NOT NULL,
  srn TEXT NOT NULL,
  branch TEXT NOT NULL,
  year TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  domains TEXT NOT NULL,          -- JSON-encoded array, e.g. ["tech","design"]
  experience TEXT,
  portfolioUrl TEXT,
  whyJoin TEXT NOT NULL,
  sourceIp TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_applications_createdAt ON applications (createdAt DESC);

CREATE INDEX IF NOT EXISTS idx_admins_email ON admins (email);

-- Prevent the same person from submitting more than one application.
-- Enforced at the DB level (belt-and-braces alongside the app-level check
-- in /api/apply) so it holds even under concurrent requests.
CREATE UNIQUE INDEX IF NOT EXISTS idx_applications_unique_email ON applications (email);

CREATE UNIQUE INDEX IF NOT EXISTS idx_applications_unique_srn ON applications (srn);

-- Audit trail for admin actions: logins (success + failure), exports, and
-- deletes. Nothing here is exposed to the client -- it's read directly
-- from Turso if you ever need to investigate.
CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actorEmail TEXT,               -- email attempted/used, even on failed logins
  action TEXT NOT NULL,          -- 'login_success' | 'login_failure' | 'login_locked' | 'export' | 'clear'
  detail TEXT,                   -- free-form context, e.g. deleted count/ids
  ip TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_audit_log_createdAt ON audit_log (createdAt DESC);
