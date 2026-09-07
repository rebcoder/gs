# AGENTS.md — GarageSale Monorepo (`gs`)

Quick-start context for AI coding agents (and humans) working in this repo. This is the canonical
entry point — `docs/` has deeper dives, linked below.

## Repository Identity

- App: GarageSale (`gs`) — a neighborhood 2nd-hand marketplace. Sellers list garage sales + items;
  buyers browse/filter (list + map) and book visit appointments.
- Structure:
  - `gs-back/` — Spring Boot REST API (Java 17, Spring Boot 3.3.x)
  - `gs-front/` — Angular 20 SPA (standalone components, Angular Material + Tailwind v4)
  - `docker-compose.yml` — local Postgres + Redis + backend orchestration
  - `docs/` — architecture, testing, and technical-review docs
- Open-source project, MIT licensed (see `LICENSE`), not deployed anywhere — designed to run locally.

## Runtime Model

- Backend: `http://localhost:8081` (H2 in-memory DB by default; Postgres/Redis available via
  `docker-compose.yml`).
- Frontend: `http://localhost:4200` (Angular dev server).
- Frontend API base URL comes from Angular environment files — **never hardcode**
  `http://localhost:8081` in a service/component:
  - Dev: `gs-front/src/environments/environment.ts`
  - Prod: `gs-front/src/environments/environment.prod.ts`

## Core Product Domain

- Users register/login and receive a JWT (`Authorization: Bearer <token>`).
- Sellers create garage sales and add items (with optional images).
- Buyers browse sales and book appointment time slots.
- Appointment rules (enforced backend-side, `AppointmentServiceImpl`):
  - Date must match the sale's date; time must fall within the sale's open hours.
  - Per-slot capacity enforced (`Sale.maxAppointmentsPerSlot`, default 3).
  - Status flow: `PENDING -> CONFIRMED/REJECTED/CANCELLED`.

## Design System

Airbnb-inspired visual language. Tokens live in `gs-front/src/styles.scss` (`:root` CSS custom
properties — colors, spacing, radius, shadows, type scale). Shared UI primitives are in
`gs-front/src/app/components/ui/*` (button, card, input, badge, modal, sale-card, etc.) — reuse these
instead of hand-rolling new styled elements. Angular Material components pick up the same palette via
the custom theme file (see `docs/ARCHITECTURE.md` for where it's wired in).

## Commands

- Backend test: `cd gs-back && ./mvnw test`
- Backend package (skip tests): `cd gs-back && ./mvnw -DskipTests package`
- Backend run (local, non-Docker): `cd gs-back && ./mvnw spring-boot:run`
- Backend via Docker: `docker compose up --build -d gs-back`
- Frontend dev: `cd gs-front && npm ci && npm start`
- Frontend unit tests: `cd gs-front && npx ng test --watch=false --browsers=ChromeHeadless`
- Frontend prod build: `cd gs-front && npx ng build --configuration production --progress=false`
- End-to-end smoke script (needs backend running + `jq`): `./test_appointment_booking.sh`

Both suites pass cleanly on JDK 17 / Node 18+ as of this writing (15/15 backend, 13+/13+ frontend) —
if you hit a Mockito/ByteBuddy inline-agent failure in a constrained sandbox, that's an environment
limitation, not a real test failure; fall back to `-DskipTests` for packaging in that case only.

## Working Conventions

- Keep `gs/` as the only git repo root.
- Avoid committing build artifacts (`target/`, `dist/`, `node_modules/`, `coverage/`).
- Prefer minimal, focused changes; update the relevant doc in `docs/` if behavior/config changes.
- Don't commit real secrets — `JWT_SECRET`, DB credentials, etc. come from env vars; the checked-in
  defaults in `application.yml`/`docker-compose.yml` are local-dev-only placeholders.

## More Docs

- `docs/ARCHITECTURE.md` — layering, domain model, API reference, runtime flows, config & hardening
- `docs/TESTING.md` — test inventory and how to run everything
- `docs/KNOWN_ISSUES.md` — known gaps and cosmetic quirks
- `CONTRIBUTING.md` — how to propose changes
