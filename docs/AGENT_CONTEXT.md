# AI Agent Context (GarageSale Monorepo)

This file is the quick-start context for AI agents working in this repository.

## 1) Repository Identity
- Repo root: `gs/`
- App name: GarageSale (`gs`)
- Structure:
  - `gs-back`: Spring Boot backend API
  - `gs-front`: Angular frontend
  - `docker-compose.yml`: backend local container orchestration
  - `AZURE_DEPLOYMENT.md`: Azure deployment settings

## 2) Current Runtime Model
- Backend runs on port `8081`.
- Frontend runs on port `4200` (Angular dev server).
- Frontend API base URL comes from Angular environment files:
  - Dev: `gs-front/src/environments/environment.ts`
  - Prod: `gs-front/src/environments/environment.prod.ts`

Important:
- Do not hardcode `http://localhost:8081` in services/components.
- Use `environment.apiBaseUrl`.

## 3) Core Product Domain
- Users register/login and receive JWT.
- Sellers create garage sales and add items.
- Buyers browse sales and book appointments.
- Appointment rules:
  - Must match sale date.
  - Must be within sale hours.
  - Slot capacity enforced per sale.
  - Status flow: `PENDING -> CONFIRMED/CANCELLED`.

## 4) Key Technical Stack
- Backend:
  - Java 17, Spring Boot 3.3.x
  - Spring Security (JWT)
  - Spring Data JPA
  - H2 default; can be switched to external DB via env vars
- Frontend:
  - Angular 20 (standalone components)
  - Angular Material + Tailwind v4
  - RxJS

## 5) Deploy Expectations
- Backend target: Azure Container Apps
- Frontend target: Azure Static Web Apps (SWA)
- SWA output path: `dist/gs-front/browser`
- SPA fallback config: `gs-front/public/staticwebapp.config.json`

## 6) Commands Agents Should Know
- Backend package:
  - `cd gs-back && ./mvnw -DskipTests package`
- Backend run local (non-docker):
  - `cd gs-back && ./mvnw spring-boot:run`
- Backend via Docker:
  - `docker compose up --build -d gs-back`
- Frontend dev:
  - `cd gs-front && npm ci && npm start`
- Frontend prod build:
  - `cd gs-front && npx ng build --configuration production --progress=false`

## 7) Testing Caveats
- Backend unit tests currently may fail in some environments due Mockito inline agent attachment limitations.
- Use `-DskipTests` when validating packaging in constrained environments.
- There is an API smoke script at repo root:
  - `./test_appointment_booking.sh`

## 8) Working Conventions
- Keep `gs/` as the only git repo root.
- Avoid committing build artifacts (`target`, `dist`, `node_modules`).
- Prefer minimal, focused changes and update docs if behavior/config changes.
- For deployment-related changes, keep `AZURE_DEPLOYMENT.md` in sync.
