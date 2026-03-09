# Bible Tracker

Track Bible reading by chapter. Sign up to add your progress; anyone can view the group.

## Setup

1. Create a project at [supabase.com](https://supabase.com) and enable **Auth → Email** (turn off "Confirm email" to skip verification).
2. In SQL Editor, run `supabase/schema.sql`.
3. Copy `.env.local.example` to `.env.local` and add your Supabase URL and anon key.

## Run

```bash
cd bible-tracker
npm install
npm run dev
```

## Deploy to GitHub Pages

1. Push the repo to GitHub.
2. Add **Settings → Secrets and variables → Actions**: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. In **Settings → Pages**, set **Source** to **GitHub Actions**.
4. On push to `main`, the workflow builds and deploys. Site will be at `https://<username>.github.io/<repo-name>/`.
