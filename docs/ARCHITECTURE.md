# Application Architecture

GarageSale is a monorepo with a decoupled Angular frontend and Spring Boot backend. This document
covers the system as a whole: layering, domain model, API surface, security, frontend structure, the
key runtime flows, and configuration for self-hosting.

## 1) High-Level View

- **Frontend** (`gs-front`): Angular SPA (standalone components) used by buyers and sellers. Talks to
  the backend over REST/HTTP(S) only.
- **Backend** (`gs-back`): Spring Boot REST API. Owns auth, data access, booking rules, and business
  logic.
- **Database**: H2 in-memory by default (local dev); PostgreSQL + Redis available via
  `docker-compose.yml` for a closer-to-production setup (Redis backs response caching).

## 2) Monorepo Layout

- `gs-back/src/main/java/...`
  - `controllers`: REST endpoints
  - `services`: business logic
  - `repositories`: JPA repositories
  - `models`: JPA entities
  - `config`: security/JWT/rate-limiting/caching/app config
  - `exception`: global error handling
- `gs-front/src/app`
  - `components`: route and UI components (feature pages, dialogs/sheets, shared UI primitives under
    `components/ui/*`)
  - `services`: API client services
  - `guards`: route guards
  - `interceptors`: HTTP interceptors (loading, auth-error)
  - `app.routes.ts`: frontend routing

## 3) Backend Architecture

### 3.1 Layering

Standard Spring layering: **controllers** (HTTP boundary, DTO mapping, `@Valid` triggers) →
**services** (business logic, authorization/ownership checks) → **repositories** (Spring Data JPA) →
**models** (JPA entities).

- Base URL (local): `http://localhost:8081`
- API prefix: `/api/*`
- Swagger UI: `/swagger-ui/index.html`
- Health check: `GET /api/test/health`

### 3.2 Domain Model

- **User**: identity, credentials, role, preferences
- **Home**: a seller's location envelope (address/area/city/lat/lng) — one-to-one with a seller
- **Sale**: a garage sale event (title/description/date/open-hours window/capacity), linked to
  seller + home
- **Item**: inventory item belonging to a sale, optionally with an uploaded image
- **Appointment**: a buyer's booking for a sale/time-slot, linked to buyer + seller + sale + home,
  with a status
- **Profile**: user profile extension (bio/rating)
- **Review**: buyer → seller feedback (present but minimally used)

Enums: `AppointmentStatus` (`PENDING`, `CONFIRMED`, `COMPLETED`, `CANCELLED`), `SaleStatus`,
`ItemCategory`, `Role`.

### 3.3 Security

- Stateless JWT authentication (`JwtAuthenticationFilter` + Spring Security filter chain).
- Protected endpoints require `Authorization: Bearer <token>`.
- Public endpoints: `/api/auth/**`, `GET /api/garage-sales`, `GET /api/garage-sales/{id}`,
  `GET /api/garage-sales/nearby`, `GET /api/appointments/slot-count`, `/api/test/**` (dev/demo only —
  see below), `/swagger-ui/**`, `/v3/api-docs/**`, `/h2-console/**`.
- Everything else requires authentication; ownership checks (buyer/seller-of-record) are enforced at
  the service layer for appointment and sale/item mutations.
- CORS is controlled by the `app.cors.allowed-origins` property (see §6), not per-controller
  annotations.
- `/api/test/**` (demo seed/clear/health helpers) is annotated `@Profile("!prod")`, so it doesn't
  exist as a bean at all when the `prod` Spring profile is active.

### 3.4 API Reference

All paths are relative to `/api`.

**Auth** (public)
- `POST /auth/register`
- `POST /auth/login`

**Garage Sales**
- `GET /garage-sales` — list/search (public)
- `GET /garage-sales/featured` (public)
- `GET /garage-sales/search?q=` (public)
- `GET /garage-sales/nearby?lat=&lng=&radiusKm=` (public)
- `GET /garage-sales/mine` — sales owned by the authenticated seller
- `GET /garage-sales/{id}` (public)
- `POST /garage-sales` — create sale
- `POST /garage-sales/{id}/items` — add item to sale
- `PUT /garage-sales/{saleId}/items/{itemId}`
- `DELETE /garage-sales/{saleId}/items/{itemId}`
- `DELETE /garage-sales/{id}` — owner-only

**Items** (generic item access, separate from the sale-scoped routes above)
- `GET /items`, `GET /items/{id}`, `POST /items`, `PUT /items/{id}`, `DELETE /items/{id}`
- `POST /items/{itemId}/image` — multipart image upload

**Appointments**
- `GET /appointments` / `GET /appointments/mine` — the authenticated buyer's bookings
- `GET /appointments/{id}` — ownership-checked
- `GET /appointments/user/{userId}`
- `POST /appointments` — create a booking (buyer id is derived from the JWT, never trusted from the
  client)
- `GET /appointments/slot-count?saleId=&timeSlot=&date=` (public)
- `POST /appointments/notify-item-removed` — notify buyers when a seller removes an item they'd
  booked around
- `PUT /appointments/{id}`, `DELETE /appointments/{id}`
- `GET /appointments/seller`, `GET /appointments/seller/sales/{saleId}`,
  `POST /appointments/seller/appointments/{id}/status?status=` — seller-side views/status updates

**Seller** (a second, overlapping set of seller-appointment routes; both exist in the current
codebase)
- `GET /seller/appointments`
- `POST /seller/appointments/{id}/status?status=`

**Profile**
- `GET /profile`, `PUT /profile`

**Test/Demo** (non-prod only, see §3.3)
- `GET /test/health`, `GET /test/garage-sales`, `POST /test/seed-demo`, `POST /test/clear-demo`,
  `GET /test/demo-info`

### 3.5 Booking Rules (Critical Business Logic)

Enforced in `AppointmentServiceImpl`:

- Appointment date must match the sale's date.
- Appointment time must fall inside the sale's open-hours window.
- Slot capacity is checked per sale + time slot (`Sale.maxAppointmentsPerSlot`, default 3) — a 4th
  booking for the same slot is rejected.
- Buyer cannot equal seller.
- Status flow: `PENDING → CONFIRMED/CANCELLED` (or `COMPLETED`); sellers update status via the
  seller status endpoint.

### 3.6 Request Lifecycle

1. **Request logging filter** — generates/propagates `X-Request-Id`, logs method/path/status/latency.
2. **Rate limiting filter** — in-memory, per-IP fixed window; returns `429` with a JSON error payload
   once the limit is hit.
3. **Security filter chain** — permits public endpoints, validates JWT and populates the Spring
   Security context for everything else.
4. **Controller → service** — controllers parse DTOs (`@Valid` where applicable) and delegate to
   services, which load entities via repositories, enforce business rules, and persist changes.
5. **Error handling** — any exception bubbles to `GlobalExceptionHandler`, which returns a structured
   `ApiErrorResponse` (`timestamp`, `status`, `error`, `message`, `path`, `requestId`,
   `validationErrors`) and logs the underlying exception server-side via SLF4J.

## 4) Frontend Architecture

### 4.1 App Shell and Routing

- Standalone Angular components throughout; routes defined in `src/app/app.routes.ts`.
- App shell: `src/app/app.ts` + `app.html` + `app.scss` (includes the global loading indicator).
- Route-level pages: home, discover/browse (list + map), sale detail, appointments, profile,
  my-sales, create-sale.
- `AuthGuard` protects private routes.
- Angular Material + Tailwind for UI; design tokens live in `gs-front/src/styles.scss`. Shared UI
  primitives are under `src/app/components/ui/*` (button, card, input, badge, modal, sale-card,
  etc.) — used instead of one-off styled elements. Angular Material components pick up the same
  palette via the custom theme file wired into the Angular build config.

### 4.2 Services and Interceptors

Thin service layer wraps backend APIs:

- `AuthService` — login/register, JWT storage/lookup, treats an expired JWT as unauthenticated
- `MarketplaceService` — sale browsing/filtering helpers + local "visit list" planner state
- `SalesService` — seller-oriented sale/item operations
- `AppointmentService` — booking and appointment management calls
- `ProfileService` — profile read/update
- `LoadingService` — global in-flight-request counter for the loading indicator

Interceptors (registered in `app.config.ts`):

- `loading.interceptor.ts` — toggles global loading state around HTTP calls
- `auth-error.interceptor.ts` — normalizes API errors and handles auth-expiry redirect

### 4.3 Session Handling

JWT is stored in `localStorage` and attached to protected calls (via service helpers/interceptors).
On an auth-failure response (expired/invalid token), the auth-error interceptor clears auth state and
redirects to `/login?sessionExpired=1`, where the login page shows a session-expired notice.

### 4.4 Environment Strategy

- Dev: `src/environments/environment.ts` (`apiBaseUrl: http://localhost:8081`)
- Prod: `src/environments/environment.prod.ts` — must be pointed at the real backend URL before a
  production build is served anywhere; a startup guard fails loudly if the placeholder URL ships.
- Angular build config performs the file replacement for `--configuration production`.

## 5) Runtime Flows

### 5.1 Authentication

1. User submits login/register form; `AuthService` calls `/api/auth/*`.
2. Backend verifies credentials (register: creates the user) and returns a JWT.
3. Frontend stores the JWT in `localStorage`; subsequent protected requests attach
   `Authorization: Bearer <token>`.
4. On auth-expiry, the interceptor logs the user out and redirects to login (§4.3).

### 5.2 Discover (Browse + Map)

1. Discover component calls `MarketplaceService.getAllSales()`.
2. An optional "origin" is derived from the user's preferred lat/lng (profile).
3. Client-side filtering applied (query, date, category, distance, price).
4. Results render as cards (infinite-scroll chunking) and as Leaflet markers on the map; selecting a
   card pans the map and opens the marker's popup.

### 5.3 Sale Detail & Item Preview

1. Route `/sale/:id` resolves the id; component calls `MarketplaceService.getSaleById(id)`.
2. UI renders a hero/gallery (from sale + item images) and the item list.
3. Clicking an item opens `SaleItemModalComponent` (Angular Material dialog) with image, name,
   price, description, seller display name, and sale/location label.
4. The modal can add the item to a local "visit list" via `MarketplaceService.addVisitItem(...)`; the
   resulting snackbar can jump to the planner route.

### 5.4 Appointment Booking

1. Buyer opens the booking dialog from sale detail and selects a date/time.
2. Frontend checks the slot-count endpoint (`GET /api/appointments/slot-count`) and shows a
   `slotsLeft` indicator, blocking submission if the slot is full.
3. Frontend posts to `POST /api/appointments` (buyer id is derived server-side from the JWT, not
   sent by the client).
4. Backend validates date/time/capacity (§3.5) and persists the appointment as `PENDING`.
5. Confirmation toast on success; seller later confirms/rejects/cancels via the seller status
   endpoint, reflected in both buyer and seller appointment lists.

### 5.5 Seller Flows

Depending on auth/ownership, sellers can: create a sale, add/edit/remove items (with optional image
upload — removing an item triggers the notify-item-removed flow so interested buyers are informed),
and manage incoming appointments for their sales (confirm/reject/cancel).

## 6) Configuration & Hardening

### Environment variables

| Variable | Purpose | Default |
|---|---|---|
| `PORT` | Backend HTTP port | `8081` |
| `JWT_SECRET` | JWT signing secret — **must** be overridden for anything beyond local dev | built-in dev fallback |
| `JWT_EXPIRATION_MS` | JWT lifetime | `86400000` (24h) |
| `SPRING_DATASOURCE_URL` / `_USERNAME` / `_PASSWORD` / `_DRIVER_CLASS_NAME` | DB connection | H2 in-memory |
| `SPRING_JPA_DATABASE_PLATFORM` | Hibernate dialect | H2 dialect |
| `SPRING_JPA_HIBERNATE_DDL_AUTO` | Schema management | `update` |
| `SPRING_H2_CONSOLE_ENABLED` | Toggle H2 web console | `true` (disable outside local dev) |
| `SPRING_DATA_REDIS_HOST` / `_PORT` / `_PASSWORD` | Redis (response caching) | `localhost` / `6379` |
| `APP_RATE_LIMIT_ENABLED` / `APP_RATE_LIMIT_REQUESTS_PER_MINUTE` | Per-IP rate limiting | `true` / `120` |
| `APP_CORS_ALLOWED_ORIGINS` | Comma-separated allowed origins — never leave wildcarded beyond local dev | `http://localhost:4200` |
| `LOG_LEVEL_ROOT` / `LOG_LEVEL_SQL` | Logging verbosity | `INFO` / `WARN` |

Frontend: `environment.prod.ts`'s `apiBaseUrl` must point at wherever the backend is actually hosted
before a production build is served anywhere (§4.4).

### Hardening features already in place

- **Structured error responses**: every exception maps to a JSON `ApiErrorResponse`
  (`timestamp`/`status`/`error`/`message`/`path`/`requestId`/`validationErrors`) via
  `GlobalExceptionHandler`, which also logs the underlying exception server-side (SLF4J, correlated
  by request id).
- **Request logging**: every request gets an `X-Request-Id` (generated or propagated) plus a log line
  with method/path/status/latency/client IP/user-agent (`RequestLoggingFilter`).
- **Rate limiting**: in-memory, per-IP, fixed 60s window, configurable requests/min, returns `429` +
  JSON payload over the limit (`RateLimitingFilter`). Single-instance only — see
  `docs/KNOWN_ISSUES.md` for the multi-replica caveat.
- **Input validation**: bean-validation annotations on request DTOs (auth, sale, item, appointment)
  with `@Valid`/`@Validated` in controllers, including cross-field checks (e.g. sale
  `startTime < endTime`).
- **CORS**: single configurable allow-list (`app.cors.allowed-origins`), not per-controller wildcards.
- **JSON cache serialization**: Redis-backed `@Cacheable` responses use a JSON serializer (with
  `JavaTimeModule` registered) rather than JDK serialization, so cached DTOs don't need to implement
  `Serializable`.

## 7) Deployment & Self-Hosting

This is a local/self-hosted project — no managed deployment target is wired up.

- Backend: `gs-back/Dockerfile` (multi-stage, non-root runtime user, `JAVA_OPTS` for runtime tuning)
  produces a standalone image. Root `docker-compose.yml` runs `gs-back` alongside `postgres` and
  `redis` (both with health checks); `gs-back/docker-compose.yml` offers a backend-only variant.
- Frontend: `npm run build` (or `npm run build:prod`) produces static assets at
  `dist/gs-front/browser` — serve them with any static host, pointed at the real backend via
  `environment.prod.ts` first.
- If self-hosting anywhere beyond localhost: set `JWT_SECRET` and `APP_CORS_ALLOWED_ORIGINS`
  explicitly, disable `SPRING_H2_CONSOLE_ENABLED` (or move off H2 entirely per the datasource vars
  above), and put a log aggregation/alerting setup in front of the structured request/error logs.
