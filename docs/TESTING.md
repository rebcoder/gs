# Testing Guide

This document explains what tests exist, how to run them, and current limitations.

## 1) Test Types in This Repo
- Backend unit/integration tests (JUnit + Mockito + Spring Boot)
- Frontend unit tests (Karma + Jasmine)
- API smoke script (`test_appointment_booking.sh`) for end-to-end booking flow checks

## 2) Backend Tests (`gs-back`)

Current test files:
- `gs-back/src/test/java/in/rebcoder/gs_back/GsBackApplicationTests.java`
- `gs-back/src/test/java/in/rebcoder/gs_back/services/AppointmentServiceTest.java`

Run commands:
- Full tests:
  - `cd gs-back && ./mvnw test`
- Package without tests:
  - `cd gs-back && ./mvnw -DskipTests package`

Notes:
- In some environments, Mockito inline agent attachment fails (ByteBuddy/JDK restriction), causing test failures unrelated to business logic.
- If this occurs in CI or constrained local envs, use `-DskipTests` for packaging and investigate Mockito/JVM config separately.

## 3) Frontend Tests (`gs-front`)

Current test files:
- `gs-front/src/app/app.spec.ts`
- `gs-front/src/app/services/appointment.service.spec.ts`

Run commands:
- Unit tests:
  - `cd gs-front && npm test`
- Production build validation:
  - `cd gs-front && npx ng build --configuration production --progress=false`

## 4) Smoke Test Script (API Flow)

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

## 5) Recommended Pre-Push Validation
1. Backend compile/package:
   - `cd gs-back && ./mvnw -DskipTests package`
2. Frontend production build:
   - `cd gs-front && npx ng build --configuration production --progress=false`
3. Smoke flow (if backend is running):
   - `./test_appointment_booking.sh`

## 6) Gaps and Future Improvements
- Add integration tests for:
  - owner-only sale delete
  - appointment self/seller access control
  - `/appointments/mine` behavior
- Add frontend tests for route guards and environment-based API base URL behavior.
- Add CI pipeline to run build + targeted tests automatically on pull requests.
