# GarageSale Frontend (`gs-front`)

Angular frontend for GarageSale. Provides browsing, sale detail, booking, appointments, auth, and profile flows.

## Stack

- Angular 20 (standalone components)
- Angular Material
- SCSS
- RxJS + HttpClient

## Prerequisites

- Node.js `18+`
- npm
- Backend API running at `http://localhost:8081`

Start backend from repo root if needed:

```bash
docker compose up --build -d gs-back
```

## Run Locally

From `gs-front/`:

```bash
npm ci
npm start
```

App URL: `http://localhost:4200`

## API Configuration

- Dev: `src/environments/environment.ts`
- Prod: `src/environments/environment.prod.ts`

Current default:
- `apiBaseUrl: 'http://localhost:8081'` (dev)

If you self-host a production build, point `environment.prod.ts` at your backend's real URL first.

## Available Scripts

- `npm start` - start local dev server (`ng serve`)
- `npm run build` - production build
- `npm test` - run frontend tests

## Key Features

- Auth: register/login with JWT
- Browse sales with filters
- View sale details and items
- Book appointment slots with availability checks
- Manage appointments (buyer and seller workflows)
- Create and manage sales
- Profile management

## Self-Hosting

This project has no managed deployment target — it's built to run locally. `npm run build` outputs
static assets to `dist/gs-front/browser` if you want to serve them yourself (any static file host or
SPA-aware web server works; just make sure unknown routes fall back to `index.html`).
