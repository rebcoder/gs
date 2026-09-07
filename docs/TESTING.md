# Testing Guide

This document explains what tests exist, how to run them, and current limitations.

## 1) Test Types in This Repo
- Backend unit/integration tests (JUnit + Mockito + Spring Boot)
- Frontend unit tests (Karma + Jasmine)
- Frontend E2E tests (Playwright) — full buyer/seller user journeys against the real running app
- API smoke script (`test_appointment_booking.sh`) for end-to-end booking flow checks

## 2) Backend Tests (`gs-back`)

Current test files (28 tests total):
- `gs-back/src/test/java/in/rebcoder/gs_back/GsBackApplicationTests.java`
- `gs-back/src/test/java/in/rebcoder/gs_back/services/AppointmentServiceTest.java`
- `gs-back/src/test/java/in/rebcoder/gs_back/services/ItemServiceImplTest.java`
- `gs-back/src/test/java/in/rebcoder/gs_back/controllers/AppointmentControllerTest.java`
- `gs-back/src/test/java/in/rebcoder/gs_back/controllers/AuthControllerTest.java`
- `gs-back/src/test/java/in/rebcoder/gs_back/controllers/GarageSaleControllerTest.java`
- `gs-back/src/test/java/in/rebcoder/gs_back/controllers/ItemControllerTest.java`
- `gs-back/src/test/java/in/rebcoder/gs_back/controllers/SellerControllerTest.java`

Run commands:
- Full tests:
  - `cd gs-back && ./mvnw test`
- Package without tests:
  - `cd gs-back && ./mvnw -DskipTests package`

Notes:
- All 28 backend tests currently pass on JDK 17. In some constrained sandboxes, Mockito's inline
  agent attachment can fail (ByteBuddy/JDK restriction) — that's an environment limitation, not a
  real regression; use `-DskipTests` for packaging in that case and investigate the JVM config
  separately.

## 3) Frontend Tests (`gs-front`)

Current test files (17 tests total):
- `gs-front/src/app/app.spec.ts`
- `gs-front/src/app/services/appointment.service.spec.ts`
- `gs-front/src/app/services/marketplace.service.spec.ts`
- `gs-front/src/app/guards/auth.guard.spec.ts`
- `gs-front/src/app/interceptors/auth-error.interceptor.spec.ts`
- `gs-front/src/app/components/discover/discover.component.spec.ts`

Run commands:
- Unit tests:
  - `cd gs-front && npm test`
- Production build validation:
  - `cd gs-front && npx ng build --configuration production --progress=false`

## 4) End-to-End Tests (Playwright)

Full buyer (register → browse → book) and seller (log in → create sale → update profile) journeys,
driven against the real running app in a real browser — not mocks. Lives in `gs-front/e2e/`.

Run commands:
- `cd gs-front && npm run e2e` (backend must already be running — see `gs-front/e2e/README.md`)

These caught several real bugs invisible to unit tests, which only mock the service/HTTP layer and
never exercise the real cache, real timezone handling, or a real multi-step browser flow — see
`CHANGELOG.md`'s "Found via the New E2E Suite" entry for specifics.

## 5) Smoke Test Script (API Flow)

Script:
- `./test_appointment_booking.sh`

What it validates:
- Demo data clear/seed
- Demo login and JWT retrieval
- Appointment creation
- Slot availability endpoint
- Appointment retrieval and sales retrieval

Prerequisites:
- Backend running on `http://localhost:8081`
- Optional frontend running on `http://localhost:4200` for manual steps
- `jq` installed (script parses JSON)

## 6) Recommended Pre-Push Validation
1. Backend compile/package:
   - `cd gs-back && ./mvnw -DskipTests package`
2. Frontend production build:
   - `cd gs-front && npx ng build --configuration production --progress=false`
3. Smoke flow (if backend is running):
   - `./test_appointment_booking.sh`
4. Full E2E suite (if backend is running): `cd gs-front && npm run e2e`

## 7) CI

`.github/workflows/ci.yml` runs backend tests and frontend tests + production build on every push/PR
to `main`. It does not run the E2E suite yet (would need a Redis service container and a running
backend in CI) — that's a natural next step, run it locally in the meantime.

## 8) Gaps and Future Improvements
- Add integration tests for:
  - owner-only sale delete
  - `/appointments/mine` behavior
- Add frontend tests for environment-based API base URL behavior.
- Wire the E2E suite into CI (needs a Redis service container + a running backend).
