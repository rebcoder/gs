# Changelog

## Unreleased

### Dependency Security
- Updated `@angular/*` packages from the resolved `20.2.1` to `20.3.30`, fixing several high-severity
  XSS advisories (GHSA-prjf-86w9-mfqv, GHSA-g93w-mfhg-p222, GHSA-jrmj-c5cx-3cw6, and related) that
  affected every Angular 20.x release before `20.3.16`/`.18`/`.22`. `npm audit` went from 48
  vulnerabilities (34 high, 1 critical) to 2 moderate, both transitive to the `karma` test runner
  (dev-only, not shipped in the production bundle).

### Security & Correctness Fixes (Backend)
- Closed authorization gaps: `GET/PUT /api/appointments/{id}`, `SellerController` appointment listing
  and status updates, and `notify-item-removed` now enforce buyer/seller ownership instead of trusting
  any authenticated (or, in one case, unauthenticated) caller.
- Removed the wildcard `@CrossOrigin(origins = "*")` annotation present on every controller, which was
  silently overriding the restricted CORS bean — CORS is now solely controlled by the new
  `app.cors.allowed-origins` config property.
- Fixed the `AppointmentStatus.CANCELED`/`CANCELLED` duplicate-enum bug and inconsistent normalization.
- Fixed `ItemServiceImpl#updateItem` (previously a no-op stub that silently dropped updates) and
  `ItemController#getItemById` (previously returned 200 with an empty body instead of 404).
- "Not found" cases now consistently return 404 (`ResourceNotFoundException`) instead of 500.
- Removed dead legacy code: `SaleController`, `UserController`, `SaleServiceImpl`, `UserServiceImpl`.
- Added `@Valid`/cross-field validation on previously-unvalidated update endpoints.
- `/api/test/**` demo endpoints now excluded outside the `prod` profile; removed unused OAuth2
  placeholder config; replaced `System.out`/`printStackTrace` with SLF4J logging.
- Backend test suite: 15 → 28 tests (new ownership, `ItemController`, `SellerController` coverage).

### Correctness & Cleanup (Frontend)
- `DiscoverComponent` (list + map + filters) wired in as the canonical `/browse` experience, replacing
  the separate, duplicated `BrowseComponent`/`MapComponent`; removed the unused duplicate
  `sale/:id/book` routed page (the booking dialog is the one real flow everywhere).
- `HomeComponent` now consumes `MarketplaceService`/shared models instead of local duplicate mapping.
- Removed dead UI affordances: non-functional forgot-password/ToS/privacy links, decorative
  Google/Facebook login buttons with no handlers, and an empty `fillDemoCredentials()` stub.
- Replaced `any` typing in the service layer (`sales.service.ts`, `appointment.service.ts`,
  `auth.service.ts`) with real interfaces; surfaced previously-silent error cases via snackbars.
- Added a loud startup guard against shipping a production build with the placeholder API URL.
- Frontend test suite: 13 → 17 tests (new `AuthGuard` and `Discover` coverage).

### Found via Live End-to-End Verification
Running the real stack (Docker Compose + Postgres/Redis + Playwright), not just unit tests, surfaced
bugs the test suites couldn't see:
- Fixed every `@Cacheable` endpoint 500ing against real Redis (JDK serialization on non-`Serializable`
  DTOs) by switching to JSON serialization (`config/CacheConfig.java`).
- Fixed non-idempotent `/api/test/seed-demo` (violated a unique constraint on repeated calls, breaking
  the app's own auto-seed-on-load behavior on a second page load).
- Removed wildcard `@CrossOrigin(origins = "*")` from all 7 controllers — it was silently overriding
  the restricted `app.cors.allowed-origins` bean added in this pass.
- `GlobalExceptionHandler`'s catch-all now logs unexpected exceptions server-side (it previously
  swallowed them entirely, making 500s undebuggable).
- Retheme `login`/`register` pages to the coral/teal palette — they were still the old default
  indigo/purple Material theme (missed by the design-system pass since they use extensive custom SCSS
  rather than the shared token classes/UI kit).

### Found via the New E2E Suite (see `gs-front/e2e/`)
Writing and actually running the full-journey Playwright suite surfaced further bugs invisible to
mocked unit tests and one-off manual checks:
- **Cache reads were still broken after the fix above.** `GenericJackson2JsonRedisSerializer`'s
  no-arg constructor activates Jackson "default typing" (embeds an `@class` field) so a cache read
  can reconstruct the original DTO type; supplying a custom `ObjectMapper` (needed for
  `LocalDate`/`LocalTime` support) bypassed that. Every *cache hit* (not the first, cache-miss
  request — only a second request within the TTL) deserialized into a raw `LinkedHashMap` and threw
  `ClassCastException`. Fixed by activating default typing on our custom mapper too
  (`config/CacheConfig.java`).
- **Booking silently used the wrong time (or got rejected) for any non-UTC-0 user.** The booking
  dialog built the appointment time as a local `Date`, then called `.toISOString()`, which converts
  to UTC before serializing — but the backend's `appointmentTime` is a timezone-naive `LocalDateTime`
  matching the sale's own naive local hours. For any user ahead of UTC (which is most of the world),
  this silently shifted the submitted hour backward — e.g. booking "9:00 AM" in UTC+5:30 sent
  `03:30`, tripping the "before sale opening hours" check outright, or landing at the wrong hour
  entirely for slots where the shifted time still happened to be in range. The same bug affected the
  slot-availability check's date lookup, sometimes checking capacity against the wrong calendar day.
  Fixed by formatting local wall-clock components directly instead of round-tripping through UTC
  (`book-appointment-dialog.component.ts`).
- **Business-rule validation errors returned 500 instead of 400/403.** Appointment date/time-window
  violations, duplicate-user registration, and invalid login credentials all threw bare
  `RuntimeException`, which `GlobalExceptionHandler`'s catch-all maps to 500 — misleading for what are
  actually client-correctable input errors. Now use `IllegalArgumentException` (400) /
  `UnauthorizedAccessException` (403), consistent with the rest of the codebase's validation checks.
- Added a real Playwright E2E suite (`gs-front/e2e/user-journey.spec.ts`) covering the full buyer
  (register → browse → book) and seller (log in → create sale → update profile) journeys — run via
  `npm run e2e`. See `gs-front/e2e/README.md`.
- Fixed registration silently dropping the phone number (`phone` vs backend's `phoneNumber` field
  name mismatch — Jackson ignores unknown JSON fields instead of erroring).
- Fixed `POST /api/test/clear-demo` throwing a foreign-key violation as soon as a demo user had a
  `Profile` row or any `Appointment` — it now deletes those before the `User`.

### Open Source Prep
- Added `LICENSE` (MIT), `AGENTS.md`, `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`, GitHub
  issue/PR templates, and a CI workflow (`.github/workflows/ci.yml`) running both test suites.
- Removed Azure-specific deployment docs/config (`AZURE_DEPLOYMENT.md`,
  `gs-front/public/staticwebapp.config.json`) — this project runs locally / self-hosted only.

### Backend (Spring Boot)
- Added `Appointment` improvements:
  - Derive buyer from authenticated JWT in `AppointmentController#createAppointment` (prevent trusting client-supplied buyerId).
  - Added `/api/appointments/slot-count` endpoint to query slot counts for a given sale/time/date.
  - Added `/api/appointments/notify-item-removed` dev endpoint to notify about item removals.
  - Enforced slot capacity (max 3) in `AppointmentServiceImpl#createAppointment`; 4th booking returns error.
  - Populated `AppointmentDto` with display fields: `buyerName`, `sellerName`, `homeArea`, `homeCity`, `homeLatitude`, `homeLongitude`.
  - Implemented buyer appointment listing (`getAppointmentsByUser`) and appointment updates (status changes).

### Frontend (Angular)
- Booking UI:
  - `book-appointment` no longer sends `buyerId` (server reads buyer from JWT).
  - Added slot availability check and `slotsLeft` indicator; prevents booking if slot is full.
- Auth / Demo UX:
  - Added demo login buttons (`demo_buyer` / `demo_seller`) to login page for quick testing.
- Appointments UI:
  - Implemented buyer/seller appointments listing and cancel/confirm actions.

### Tests & Scripts
- Added API-driven E2E verification scripts to seed demo data and validate booking + approval flows.
- Added capacity test script that verifies 4th booking fails when 3 appointments exist for same slot.

### Dev utils
- Added `/api/test/demo-info` to expose demo entity IDs for local debugging.


## Notes
- H2 in-memory DB is used for dev; demo seeding endpoints will create demo users/sales/items.
- JWT tokens now include a `roles` claim where available.
