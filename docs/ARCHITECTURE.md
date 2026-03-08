# Application Architecture

GarageSale is a monorepo with a decoupled frontend and backend.

## 1) High-Level View
- Frontend (`gs-front`):
  - Angular SPA used by buyers and sellers.
  - Talks to backend REST APIs over HTTP(S).
- Backend (`gs-back`):
  - Spring Boot REST API.
  - Handles auth, data access, booking rules, and business logic.
- Database:
  - Default local mode: in-memory H2.
  - Production: expected external managed DB (via Spring datasource env vars).

## 2) Monorepo Layout
- `gs-back/src/main/java/...`
  - `controllers`: REST endpoints
  - `services`: business logic
  - `repositories`: JPA repositories
  - `models`: JPA entities
  - `config`: security/JWT/app config
- `gs-front/src/app`
  - `components`: route and UI components
  - `services`: API client services
  - `guards`: route guards
  - `app.routes.ts`: frontend routing

## 3) Backend Architecture

### 3.1 API Layer
- Main API prefix: `/api`
- Primary domains:
  - `/api/auth` login/register
  - `/api/garage-sales` sale and item operations
  - `/api/appointments` appointment booking and status
  - `/api/profile` user profile
  - `/api/test` demo/health helpers

### 3.2 Security
- JWT stateless authentication.
- Protected APIs require `Authorization: Bearer <token>`.
- Auth endpoints are publicly accessible.

### 3.3 Domain Model
- `User`: account identity and profile-related fields
- `Home`: seller location envelope
- `Sale`: garage sale metadata (date/time/capacity/location)
- `Item`: inventory item for a sale
- `Appointment`: buyer booking against sale/time slot
- `Profile`, `Review`: additional user-domain data

### 3.4 Booking Rules (Critical Business Logic)
- Appointment date must match sale date.
- Appointment time must be inside sale open hours.
- Slot capacity checked per sale+time.
- Seller can update appointment status.

## 4) Frontend Architecture

### 4.1 App Shell and Routing
- Standalone Angular components.
- Route-level pages include home, browse, map, sale detail, appointments, profile, my-sales, create-sale.
- Auth guard protects private routes.

### 4.2 State and API Access
- Thin service layer wraps backend APIs:
  - `AuthService`
  - `SalesService`
  - `AppointmentService`
  - `ProfileService`
- JWT token stored in localStorage and attached to protected calls.

### 4.3 Environment Strategy
- Dev: `environment.ts`
- Prod: `environment.prod.ts`
- Production replacement configured in Angular build config.

## 5) Runtime Flows

### 5.1 Authentication
1. User submits credentials.
2. Backend returns JWT.
3. Frontend stores JWT and uses it on subsequent requests.

### 5.2 Sale Creation
1. Seller fills create-sale form.
2. Frontend posts to `/api/garage-sales`.
3. Backend validates and persists sale data.

### 5.3 Appointment Booking
1. Buyer opens sale detail and selects date/time.
2. Frontend checks slot count endpoint.
3. Frontend posts appointment request.
4. Backend validates date/time/capacity and stores appointment.
5. Seller confirms or cancels through seller status endpoint.

## 6) Deployment Architecture
- Backend containerized via `gs-back/Dockerfile`.
- Local compose service in root `docker-compose.yml`.
- Frontend built static artifacts served by Azure SWA.
- Deployment details and required env vars are documented in `AZURE_DEPLOYMENT.md`.
