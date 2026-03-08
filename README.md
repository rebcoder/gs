# GarageSale Monorepo (`gs`)

GarageSale is a neighborhood marketplace app where sellers post garage sales and items, and buyers discover sales and book appointment slots.

## Repo Structure

- `gs-back/` - Spring Boot backend API (default port `8081`)
- `gs-front/` - Angular frontend (dev server port `4200`)
- `docker-compose.yml` - local backend container orchestration
- `AZURE_DEPLOYMENT.md` - Azure Container Apps + Static Web Apps deployment notes
- `docs/` - architecture, testing, and AI-agent context docs

## Local Development

### Prerequisites

- Docker Desktop
- Node.js `18+` and npm

### 1) Start Backend in Docker

From repo root:

```bash
docker compose up --build -d gs-back
```

Check health:

```bash
curl http://localhost:8081/api/test/health
```

Expected response: `Backend is running!`

### 2) Start Frontend with npm

```bash
cd gs-front
npm ci
npm start
```

Open: `http://localhost:4200`

### 3) Verify Integration

- Frontend API base URL is `http://localhost:8081` in `gs-front/src/environments/environment.ts`.
- Backend CORS allows frontend local access.

### Stop Local Services

```bash
docker compose down
```

Stop frontend with `Ctrl+C` in its terminal.

## Demo Data (Optional)

```bash
curl -X POST http://localhost:8081/api/test/clear-demo
curl -X POST http://localhost:8081/api/test/seed-demo
curl -s http://localhost:8081/api/test/demo-info
```

Demo accounts:
- `demo_user` / `demo123`
- `demo_user2` / `demo123`

## Smoke Test Script

From repo root:

```bash
./test_appointment_booking.sh
```

This validates seed/login/appointment booking flow against local backend.

## Deployment Target

- Backend: Azure Container Apps (container image from `gs-back/`)
- Frontend: Azure Static Web Apps (build from `gs-front/`)

See full guide in `AZURE_DEPLOYMENT.md`.

## Additional Docs

- `docs/AGENT_CONTEXT.md`
- `docs/ARCHITECTURE.md`
- `docs/TESTING.md`
