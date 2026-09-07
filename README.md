# Layer8 — Recruitment Form

Public form at `/join`, admin dashboard at `/admin` (protected login),
submissions stored in MongoDB Atlas (TLS) and mirrored live to a Google
Sheet. Styled to the shared Layer8 design system so it can be dropped
straight into the main site's repo later.

## 1. Install

```bash
npm install
```

## 2. Set up MongoDB Atlas

1. Create a free cluster at mongodb.com/atlas.
2. Database Access → add a database user with a strong generated password
   (not reused from anywhere else).
3. Network Access → add your IP for local dev; for the deployed app on
   Vercel, either allow `0.0.0.0/0` (fine, since the DB still requires auth
   + TLS) or use Atlas's Vercel integration for tighter access.
4. Get the connection string (starts `mongodb+srv://`) — this already
   enforces TLS, which the code also sets explicitly in `src/lib/mongodb.ts`.
5. Copy `.env.example` to `.env.local` and fill in `MONGODB_URI`.

## 3. Set up Google Sheets live sync

1. console.cloud.google.com → new project → enable **Google Sheets API**.
2. IAM & Admin → Service Accounts → create one → Keys → **Add key → JSON**.
3. Create a Google Sheet, add a tab named exactly `Submissions`, with header
   row: `Submitted At | Name | SRN | Branch | Year | Email | Phone | Domains | Experience | Portfolio | Why Join`.
4. Share that Sheet with the service account's email (found in the JSON key)
   as **Editor**.
5. Fill `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`, and
   `GOOGLE_SHEET_ID` (the long ID in the sheet's URL) into `.env.local`.

If you skip this section, the form still works — submissions just won't
mirror to a sheet until you configure it.

## 4. Set up admin login

Generate a secret and set `NEXTAUTH_SECRET` / `NEXTAUTH_URL` in `.env.local`
(see `.env.example`).

Then create the 4 admin accounts (you, your friend, + 2 more):

```bash
npm run seed:admin -- "Your Name" you@pes.edu "a-strong-password"
npm run seed:admin -- "Friend Name" friend@pes.edu "another-strong-password"
# ...repeat for the other 2 admins
```

Run this against whichever `MONGODB_URI` you're using at the time (local
`.env.local` for dev, or point it at the production URI temporarily to seed
prod admins).

## 5. Run locally

```bash
npm run dev
```

Visit `http://localhost:3000/join` for the form, `http://localhost:3000/admin`
for the dashboard.

## 6. Deploy to Vercel

1. Push this to its own GitHub repo (or a branch/folder the tech team can
   later merge into the main site's repo).
2. Import into Vercel, add all the env vars from `.env.example` under
   Project Settings → Environment Variables (for both Production and
   Preview).
3. Set `NEXTAUTH_URL` to the deployed URL (e.g. `https://your-preview.vercel.app`).

## Security notes (what's already handled, and what to keep in mind)

- **TLS everywhere**: MongoDB via `mongodb+srv://` + explicit `tls: true`;
  all traffic over HTTPS via Vercel by default.
- **Server-side validation**: every field is re-validated and sanitized
  server-side with Zod, regardless of what the client sends.
- **Honeypot field**: a hidden `website` field catches most bots for free.
- **Rate limiting**: 5 submissions/minute per IP. This is in-memory, so on
  serverless it's a best-effort deterrent, not a hard guarantee — see the
  comment in `src/lib/rateLimit.ts` for the Upstash Redis upgrade path if
  spam becomes a real problem.
- **Least-privilege secrets**: the Mongo user and the Google service account
  should each only have access to what this app needs — don't reuse a
  personal/admin credential.
- **Admin auth**: NextAuth credential login, bcrypt-hashed passwords,
  8-hour sessions, `/admin/*` routes blocked by middleware unless signed in.
- **No file uploads**: portfolios are submitted as links, not files — this
  avoids needing separate file storage/scanning and a bigger attack surface.
  If you want file uploads later, that's a scoped addition (e.g. S3 with
  signed URLs + type/size limits), not a default.
- **Nothing sensitive in the repo**: all secrets live in env vars, `.env*`
  is gitignored.

## What to tell the team before this goes live

- Who exactly holds the 4 admin logins, and rotate passwords if anyone
  leaves the team.
- Treat the Google Sheet like it contains PII (it does) — don't make it
  publicly link-shareable, only share with people who need it.
