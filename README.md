# RepLog — Fitness Tracker

Log your exercises, the weight and reps you did, and watch your strength
progress over time with charts. Sign in with Google so you and your friends can
each keep a private training log.

## Tech stack

- **Next.js 16** (App Router, Server Actions, Turbopack)
- **Auth.js v5 (NextAuth)** with Google OAuth + database sessions
- **Prisma 7** ORM with the `pg` driver adapter
- **Neon** (hosted Postgres)
- **Recharts** for progression charts
- **Tailwind CSS v4**

## Features

- Google sign-in (each user only sees their own data)
- Create exercises (Bench Press, Squat, …)
- Log sets: weight, reps, date and optional notes
- Per-exercise progression charts: **top weight**, **estimated 1RM** (Epley) and
  **total volume** over time
- Dashboard with totals and per-exercise summaries
- Delete sets and exercises

---

## 1. Prerequisites

- Node.js 20.9+ (you have it)
- A free [Neon](https://neon.tech) account
- A Google account (for the OAuth credentials)

## 2. Set up the database (Neon)

1. Go to <https://neon.tech>, create a project (any region near you).
2. On the project dashboard, open **Connection Details**.
3. Copy the **pooled** connection string. It looks like:
   ```
   postgresql://USER:PASSWORD@ep-xxxx-pooler.REGION.aws.neon.tech/neondb?sslmode=require
   ```
4. Paste it as `DATABASE_URL` in your `.env` file (see step 4).

## 3. Set up Google OAuth

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create (or pick) a project.
3. In the left menu: **APIs & Services → OAuth consent screen**.
   - User type: **External**, then fill in app name, your email, and save.
   - Under **Audience**, add your Google account (and your friends' emails) as
     **Test users** while the app is in "Testing" mode — only test users can
     log in until you publish the consent screen.
4. Go to **APIs & Services → Credentials → Create Credentials → OAuth client ID**.
   - Application type: **Web application**.
   - **Authorized JavaScript origins:**
     - `http://localhost:3000`
   - **Authorized redirect URIs:**
     - `http://localhost:3000/api/auth/callback/google`
   - (When you deploy, also add your production URL, e.g.
     `https://your-app.vercel.app` and
     `https://your-app.vercel.app/api/auth/callback/google`.)
5. Click **Create**. Copy the **Client ID** and **Client secret**.
6. Put them in `.env` as `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET`.

## 4. Configure environment variables

A `.env` file already exists with an `AUTH_SECRET` generated for you. Open it and
fill in the three TODO values:

```dotenv
DATABASE_URL="postgresql://...neon.tech/neondb?sslmode=require"   # from step 2
AUTH_SECRET="<already generated for you>"
AUTH_URL="http://localhost:3000"
AUTH_GOOGLE_ID="<client id from step 3>"
AUTH_GOOGLE_SECRET="<client secret from step 3>"
```

> Regenerate the secret any time with `npx auth secret`.
> `.env.example` documents every variable.

## 5. Install, migrate and run

```bash
npm install              # also runs `prisma generate`
npm run db:migrate       # creates the tables in your Neon database
npm run dev              # http://localhost:3000
```

Open <http://localhost:3000>, click **Continue with Google**, and start logging.

### Useful scripts

| Script               | What it does                          |
| -------------------- | ------------------------------------- |
| `npm run dev`        | Start the dev server                  |
| `npm run build`      | Production build                      |
| `npm run db:migrate` | Create/apply migrations (development) |
| `npm run db:deploy`  | Apply migrations in production/CI     |
| `npm run db:studio`  | Open Prisma Studio to browse data     |

---

## Deploying (so friends can use it)

1. Push this folder to a Git repo and import it into
   [Vercel](https://vercel.com/new).
2. Add the same env vars in **Project → Settings → Environment Variables**, but
   set `AUTH_URL` to your production URL (e.g. `https://your-app.vercel.app`).
3. In Google Cloud, add the production origin and redirect URI (see step 3).
4. Run migrations against Neon once: `npm run db:deploy` (or add it to the build
   command: `prisma migrate deploy && next build`).
5. Publish the OAuth consent screen (or keep it in Testing and add each friend as
   a test user).

## Project structure

```
src/
  auth.ts                     # Auth.js (NextAuth) config — Google + Prisma adapter
  app/
    page.tsx                  # Landing / Google sign-in
    api/auth/[...nextauth]/   # Auth.js route handler
    dashboard/
      layout.tsx              # Auth-gated shell (header, sign out)
      page.tsx                # Overview, log form, exercise list
      exercise/[id]/page.tsx  # Progression chart + set history
  components/                 # Client components (forms, chart, buttons)
  lib/
    prisma.ts                 # Prisma client (pg adapter) singleton
    dal.ts                    # Session helpers (requireUserId)
    queries.ts                # Read queries + progression math
    actions.ts                # Server actions (create/log/delete)
    auth-actions.ts           # signIn / signOut server actions
prisma/schema.prisma          # Data model
```

## Notes

- All data access is scoped by `userId`, so each signed-in user only ever sees
  and edits their own exercises and sets.
- Estimated 1RM uses the Epley formula: `weight × (1 + reps / 30)`.
- Weights are in kilograms; adjust the labels in the form components if you
  prefer pounds.
