# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server with HMR (Vite)
npm run build    # Production build to dist/
npm run preview  # Serve the production build locally
npm run lint     # Run ESLint
```

There is no test runner configured in this project.

## Architecture

**MapaApto** is a single-page React app (Vite + React 19) for Córdoba, Argentina. It lets users find businesses that serve people with dietary restrictions (celiac disease, diabetes, SIBO, lactose intolerance). The UI is entirely in Spanish.

### State management

`AppContext` (`src/context/AppContext.jsx`) is the single source of truth for all runtime state. It initializes businesses from the static mock data and persists the user profile to `localStorage` under the key `mapaApto_profile`. There is no backend — all data lives in memory for the session.

Context exposes:
- `userProfile` / `updateProfile` — name + array of restriction IDs
- `businesses` / `addBusiness` / `approveBusiness` / `rejectBusiness` — full business list with pending/verified states

### Data layer

`src/data/mockData.js` is the only data source. It exports:
- `RESTRICTIONS` — the four dietary restriction definitions (id, label, color)
- `BUSINESS_TYPES` — the four establishment categories (id, label, color)
- `CERTIFICATIONS` — mapping of cert codes to full names (RNPA, ALG, RME, POES, ACA)
- `mockBusinesses` — seed data; businesses with `pending: true` start in the admin queue

### Business lifecycle

1. A business owner submits via `/registro-comercio` → `addBusiness()` adds it to state with `{ verified: false, pending: true }` and a randomized lat/lng near Córdoba center
2. An admin logs in at `/admin` (demo password: `admin123`) and approves or rejects it
3. Only `{ verified: true, pending: false }` businesses appear on the map

### Map

`MapView` (`src/components/MapView.jsx`) uses `react-leaflet` over OpenStreetMap tiles, centered on Córdoba (-31.4201, -64.1888). Each marker uses a custom SVG pin colored by business type. Leaflet's CSS must be imported at the app entry point (`main.jsx`) — this is already done.

The `Mapa` page applies two independent filters (restrictions AND types) using `useMemo`. Filter state is pre-seeded from `userProfile.restrictions` if the user has a saved profile.

### Routing

All routes are in `App.jsx`. There is no auth guard — the admin panel handles authentication locally with a hardcoded password.

| Route | Page |
|---|---|
| `/` | Home landing |
| `/mapa` | Map + sidebar filters |
| `/perfil` | User profile editor |
| `/comercio/:id` | Business detail |
| `/registro-comercio` | Business registration form |
| `/admin` | Admin approval panel |

### Styling

Plain CSS only — no framework, no CSS modules. Global styles in `src/index.css`; `src/App.css` is minimal. Class names follow a BEM-like convention (`.page`, `.card`, `.form-group`, `.btn`, `.btn-primary`, etc.).

### ESLint

`no-unused-vars` is configured to ignore names matching `^[A-Z_]` (used for React JSX elements imported but not called as functions).
