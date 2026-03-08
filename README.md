# Bible Tracker

Track your Bible reading progress. No login—data stays in your browser.

## Run

```bash
cd bible-tracker
npm install
npm run dev
```

Open http://localhost:3000. Mark days complete; progress is saved in localStorage.

## Deploy to GitHub Pages

1. Push the repo to GitHub.
2. In repo **Settings → Pages**, set **Source** to **GitHub Actions**.
3. On push to `main`, the workflow builds and deploys. Site will be at `https://<username>.github.io/<repo-name>/`.

For a custom domain or root URL, set `NEXT_PUBLIC_BASE_PATH` to `""` when building.
