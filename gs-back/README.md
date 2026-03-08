# GarageSale Backend (`gs-back`)

Spring Boot REST API for GarageSale. Handles authentication, profiles, garage sales, items, and appointment booking with slot-capacity checks.

## Stack

- Java 17
- Spring Boot 3.3 (Web, Security, Data JPA, Validation)
- JWT auth
- H2 in-memory DB by default
- Optional PostgreSQL via env vars

## Run Locally

### Option A: Docker (recommended)

From monorepo root:

```bash
docker compose up --build -d gs-back
```

### Option B: Run directly

From `gs-back/`:

```bash
./mvnw spring-boot:run
```

## Verify Backend

- Base URL: `http://localhost:8081`
- Health: `GET /api/test/health`
- Swagger UI: `http://localhost:8081/swagger-ui/index.html`
- H2 Console: `http://localhost:8081/h2-console`

## Useful Local Endpoints

- `POST /api/test/seed-demo`
- `POST /api/test/clear-demo`
- `GET /api/test/demo-info`

## Core API Areas

- `/api/auth` - register/login
- `/api/profile` - current user profile
- `/api/garage-sales` - sales and items
- `/api/appointments` - buyer/seller appointments, slot counts, status updates

## Environment Configuration

Main config file: `src/main/resources/application.yml`

Important env vars:

- `PORT` (default `8081`)
- `JWT_SECRET`
- `JWT_EXPIRATION_MS` (default `86400000`)
- `SPRING_DATASOURCE_URL`
- `SPRING_DATASOURCE_USERNAME`
- `SPRING_DATASOURCE_PASSWORD`
- `SPRING_DATASOURCE_DRIVER_CLASS_NAME`
- `SPRING_JPA_HIBERNATE_DDL_AUTO`
- `SPRING_H2_CONSOLE_ENABLED`

For production, avoid `create-drop` and disable H2 console.

## Build and Test

```bash
./mvnw clean package
./mvnw test
```

## Container Build (direct)

From `gs-back/`:

```bash
docker build -t gs-back:local .
docker run --rm -p 8081:8081 gs-back:local
```
