# Citymath

**Live site: https://corychainsman.github.io/citymath/**

Mobile-first interactive comparison of US city populations. Add cities to unnamed stacks and compare the stack totals on a shared horizontal scale.

Stack choices are stored in the URL — share a link to share a comparison:

```
/?stacks=new-york,philadelphia,boston;los-angeles,san-diego,san-jose
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
3. Push to `main` (or run the workflow from the Actions tab). Site goes live at `https://corychainsman.github.io/citymath/`.

### Option B — Vercel or Netlify

Connect the repo on either platform — both auto-detect Vite. No config required.

### Option C — Anywhere static

`npm run build` produces a static `dist/` folder. Drop it on any host (Cloudflare Pages, S3, Surge, etc.).

## URL parameters

| Param    | Format                          | Example                          |
| -------- | ------------------------------- | -------------------------------- |
| `stacks` | Semicolon-separated stacks, each with comma-separated city slugs | `stacks=new-york,boston;houston,austin` |

Slugs are the city name, lowercased, with spaces replaced by hyphens (e.g., `oklahoma-city`, `san-francisco`). Unknown slugs are silently dropped.

Legacy `target` and `stack` links are still accepted and converted into the new stack format.

## Stack

Vite · React 18 · Inter & IBM Plex Mono (Google Fonts). No CSS framework — CSS is kept in `src/App.jsx` with a custom palette.

## Data

[U.S. Census Bureau, July 2024 estimates](https://en.wikipedia.org/wiki/List_of_United_States_cities_by_population), top 30 incorporated cities. Hardcoded as a constant in `src/App.jsx` — no API calls.

## License

MIT
