# Citymath Agent Guide

## What This Repo Is

Citymath is a mobile-first React/Vite single-page app for comparing populations of large US cities. A user chooses one target city, stacks one or more other cities, and the app shows whether the stacked population beats or trails the target.

The live site is intended for GitHub Pages at:

https://corychainsman.github.io/citymath/

## Product Behavior

- The app compares the top 30 incorporated US cities by July 2024 population estimate.
- City data is hardcoded in `src/App.jsx`; there is no backend, API call, database, or generated data file.
- URL query parameters are the sharing mechanism:
  - `target=<city-slug>` chooses the target city.
  - `stack=<city-slug>,<city-slug>` chooses the stack.
- Unknown slugs are silently ignored.
- The default/demo state is New York as the target and Los Angeles plus Houston as the stack.

## Tech Stack

- Vite
- React 18
- `@vitejs/plugin-react`
- Inline styles in React components
- Google Fonts injected at runtime from `src/App.jsx`
- No CSS framework
- No test runner currently configured

## Important Files

- `src/App.jsx` contains almost everything: city data, slug helpers, URL state sync, palette, layout, and subcomponents.
- `src/main.jsx` mounts the React app.
- `vite.config.js` sets `base: "./"` so the built static app works on GitHub Pages project paths and root-hosted static platforms.
- `.github/workflows/deploy.yml` builds with Node 20 and deploys `dist/` to GitHub Pages on pushes to `main`.
- `README.md` is user-facing setup, deploy, URL parameter, data, and license documentation.

## Local Commands

Install dependencies:

```bash
npm install
```

Run the dev server:

```bash
npm run dev
```

Build production assets:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

For verification, `npm run build` is the main check available unless a test runner is added later.

## Development Notes

- Keep the app static and client-only unless the task explicitly changes that direction.
- Preserve URL-shareable state when changing comparison behavior.
- Be careful when editing city slugs or city names; shared links depend on slug values.
- If updating city data, update the source note in the UI and README if the source or date changes.
- Match the existing compact, mobile-first visual style. Most styling currently lives inline in `src/App.jsx`.
- Avoid broad refactors unless they directly support the requested change; the app is intentionally small.

## Deployment Notes

The GitHub Pages workflow runs:

```bash
npm ci
npm run build
```

and uploads `dist/`. Keep `vite.config.js` compatible with static hosting unless the deployment target changes.
