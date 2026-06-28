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

## Live app

Deployed at https://webaptos.web.app/ via Firebase Hosting.

## Architecture

**MapaApto / PuntoSano** is a single-page React 19 app (Vite) for Córdoba, Argentina. It lets users find businesses that serve people with dietary restrictions (celiac disease, diabetes, SIBO, lactose intolerance). The UI is entirely in Spanish.

### Auth & Roles

`AuthContext` (`src/context/AuthContext.jsx`) wraps Firebase Auth via `onAuthStateChanged`. On sign-in it fetches the user's `role` from Firestore (`users/{uid}.role`). The context exposes `currentUser`, `userRole`, and auth actions.

Supported auth methods:
- Email/password with email verification (`sendEmailVerification`)
- Google OAuth (`GoogleAuthProvider`)
- Apple OAuth (`OAuthProvider('apple.com')`)
- Facebook OAuth (`FacebookAuthProvider`)

Roles: `user` (default) and `admin`. Admin access is enforced by `AdminRoute`.

### App state

`AppContext` (`src/context/AppContext.jsx`) subscribes to the Firestore `businesses` collection via `onSnapshot` (real-time). It also loads the logged-in user's profile from Firestore (`users/{uid}`).

Context exposes businesses list, loading/error states, profile, and all business CRUD operations.

### Data layer — Firestore

All data is persisted in Cloud Firestore. No local mock data is used in production.

Collections:
- `businesses` — all business records with status lifecycle
- `users` — user profiles and roles
- `users/{uid}/favorites` — user's favorite businesses (subcollection)
- `businesses/{id}/reviews` — reviews subcollection (real-time, ordered by date); rating average is recalculated on each write/delete

### Business lifecycle

Status field values: `pendiente` → `aprobado` / `rechazado` / `suspendido`

1. Business owner submits via `/registro-comercio` → `addBusiness()` creates a Firestore doc with `{ verified: false, pending: true, status: 'pendiente' }`
2. Admin logs in at `/admin` and approves, rejects, or suspends
3. On each admin action, EmailJS sends a transactional email to the owner
4. Only `{ verified: true, status: 'aprobado' }` businesses appear on the map

### Firebase Storage

`storageService.js` handles:
- Business photos (`fotos/{businessId}/foto_{index}.jpg`) — compressed to max 1920px before upload
- Certificates (`certificados/{businessId}/{certCode}.{ext}`)
- Menus (`menus/{businessId}/menu.{ext}`)

### EmailJS

`utils/emailService.js` sends transactional emails via `@emailjs/browser`. Disabled in dev (`import.meta.env.DEV`). Uses two templates configured via env vars:
- `VITE_EMAILJS_TEMPLATE_APROBACION` — approval notification
- `VITE_EMAILJS_TEMPLATE_RECHAZO` — rejection or suspension notification (uses an `accion` variable to differentiate)

### Map

`MapView` (`src/views/components/MapView.jsx`) uses `react-leaflet` over OpenStreetMap tiles, centered on Córdoba (-31.4201, -64.1888). Each marker uses a custom SVG pin colored by business type. Leaflet's CSS must be imported at the app entry point (`main.jsx`) — this is already done.

The `Mapa` page applies two independent filters (restrictions AND types) using `useMemo`. Filter state is pre-seeded from `userProfile.restrictions`.

### Routing

All routes are in `App.jsx`. Protected routes use `PrivateRoute` (requires login) and `AdminRoute` (requires `role === 'admin'`).

| Route | Protection | Page |
|---|---|---|
| `/` | — | Home landing |
| `/mapa` | — | Map + sidebar filters |
| `/comercio/:id` | — | Business detail + reviews |
| `/login` | — | Login |
| `/register/tipo` | — | Role selection (user / business owner) |
| `/register` | — | Registration form |
| `/politicas` | — | Privacy policy |
| `/verificar-email` | — | Email verification landing |
| `/perfil` | PrivateRoute | User profile + dietary restrictions |
| `/registro-comercio` | PrivateRoute | New business registration form |
| `/registro-comercio/:id` | PrivateRoute | Edit existing business |
| `/mi-comercio` | PrivateRoute | Business owner dashboard |
| `/admin` | AdminRoute | Admin approval panel |

### Styling

Plain CSS only — no framework, no CSS modules. Global styles in `src/index.css`; `src/App.css` is minimal. Class names follow a BEM-like convention (`.page`, `.card`, `.form-group`, `.btn`, `.btn-primary`, etc.).

### ESLint

`no-unused-vars` is configured to ignore names matching `^[A-Z_]` (used for React JSX elements imported but not called as functions).