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
  domains TEXT NOT NULL,          -- JSON-encoded array, max 2 domains
  domainAnswers TEXT,             -- JSON-encoded domain-specific answers
  experience TEXT,
  portfolioUrl TEXT,
  whyJoin TEXT NOT NULL,
  -- Tech-domain-only questions, filled only when "tech" is picked as a domain.
  techCyberExperience TEXT,
  techLanguage TEXT,
  techWhyDomain TEXT,
  techPriorExperience TEXT,
  techCtfParticipated TEXT,
  techCtfOther TEXT,
  techCtfConfidence TEXT,
  techGithub TEXT,
  techLinkedin TEXT,
  techProject TEXT,
  -- Events-domain-only questions, filled only when "events" is picked as a domain.
  eventsWhyJoin TEXT,
  eventsPriorExperience TEXT,
  eventsPlanSteps TEXT,
  eventsOrientationIdeas TEXT,
  eventsExcites TEXT,
  sourceIp TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);

-- The columns below are added via ALTER TABLE for anyone who already has an
-- `applications` table from before the tech-domain questions existed. On a
-- brand-new database these are no-ops since CREATE TABLE above already
-- includes them, but migrate.ts tolerates the "duplicate column" error either
-- way so this file stays safe to re-run.
ALTER TABLE applications ADD COLUMN techCyberExperience TEXT;
ALTER TABLE applications ADD COLUMN techLanguage TEXT;
ALTER TABLE applications ADD COLUMN techWhyDomain TEXT;
ALTER TABLE applications ADD COLUMN techPriorExperience TEXT;
ALTER TABLE applications ADD COLUMN techCtfParticipated TEXT;
ALTER TABLE applications ADD COLUMN techCtfOther TEXT;
ALTER TABLE applications ADD COLUMN techCtfConfidence TEXT;
ALTER TABLE applications ADD COLUMN techGithub TEXT;
ALTER TABLE applications ADD COLUMN techLinkedin TEXT;
ALTER TABLE applications ADD COLUMN techProject TEXT;
ALTER TABLE applications ADD COLUMN eventsWhyJoin TEXT;
ALTER TABLE applications ADD COLUMN eventsPriorExperience TEXT;
ALTER TABLE applications ADD COLUMN eventsPlanSteps TEXT;
ALTER TABLE applications ADD COLUMN eventsOrientationIdeas TEXT;
ALTER TABLE applications ADD COLUMN eventsExcites TEXT;

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
