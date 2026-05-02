# Citymath

Mobile-first interactive comparison of US city populations. Pick a target city, stack other cities together, and see how they measure up.

All choices are stored in the URL — share a link to share a comparison:

```
/?target=new-york&stack=los-angeles,houston
```

## Run locally

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually `http://localhost:5173`).

## Build for production

```bash
npm run build       # outputs to dist/
npm run preview     # serves the dist/ folder locally
```

## Deploy

### Option A — GitHub Pages (auto, recommended)

This repo ships with a workflow at `.github/workflows/deploy.yml` that builds and deploys on every push to `main`.

1. Push the repo to GitHub.
2. In the repo, go to **Settings → Pages → Build and deployment → Source** and select **GitHub Actions**.
3. Push to `main` (or run the workflow from the Actions tab). Site goes live at `https://<username>.github.io/<repo-name>/`.

### Option B — Vercel or Netlify

Connect the repo on either platform — both auto-detect Vite. No config required.

### Option C — Anywhere static

`npm run build` produces a static `dist/` folder. Drop it on any host (Cloudflare Pages, S3, Surge, etc.).

## URL parameters

| Param    | Format                          | Example                          |
| -------- | ------------------------------- | -------------------------------- |
| `target` | One city slug                   | `target=new-york`                |
| `stack`  | Comma-separated list of slugs   | `stack=los-angeles,houston,boston` |

Slugs are the city name, lowercased, with spaces replaced by hyphens (e.g., `oklahoma-city`, `san-francisco`). Unknown slugs are silently dropped.

## Stack

Vite · React 18 · Fraunces & IBM Plex (Google Fonts). No CSS framework — inline styles + a custom palette.

## Data

[U.S. Census Bureau, July 2024 estimates](https://en.wikipedia.org/wiki/List_of_United_States_cities_by_population), top 30 incorporated cities. Hardcoded as a constant in `src/App.jsx` — no API calls.

## License

MIT
