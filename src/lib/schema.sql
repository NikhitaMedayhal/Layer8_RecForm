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
