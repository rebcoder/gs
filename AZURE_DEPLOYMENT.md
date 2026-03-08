# Azure Deployment Guide

This repo is now structured for:
- Backend: Azure Container Apps (Docker image from `gs-back`)
- Frontend: Azure Static Web Apps (from `gs-front`)

## 1) Backend (Azure Container Apps)

Build context:
- `gs-back/`
- Dockerfile: `gs-back/Dockerfile`

Container port:
- App listens on `PORT` env var (fallback `8081`)
- In Azure Container Apps, set target port to `8081`

Recommended environment variables:
- `JWT_SECRET` (required for production)
- `JWT_EXPIRATION_MS` (optional, default `86400000`)
- `SPRING_DATASOURCE_URL` / `SPRING_DATASOURCE_USERNAME` / `SPRING_DATASOURCE_PASSWORD` (if using external DB)
- `SPRING_JPA_HIBERNATE_DDL_AUTO` (for prod prefer `validate` or `update`, not `create-drop`)
- `SPRING_H2_CONSOLE_ENABLED=false` (for production)

## 2) Frontend (Azure Static Web Apps)

SWA build settings:
- App location: `gs-front`
- App build command: `npm run build`
- Output location: `dist/gs-front/browser`

SPA routing:
- `gs-front/public/staticwebapp.config.json` is included for client-side route fallback.

Production API URL:
- Set `gs-front/src/environments/environment.prod.ts`:
  - `apiBaseUrl: "https://<your-backend-domain>"`

## 3) CORS / API access

Frontend calls backend directly over HTTPS.
Make sure backend is publicly reachable from SWA and CORS policy allows your SWA domain.

## 4) Monorepo note

`gs/` is the only git repo root now. `gs-back` and `gs-front` are regular folders, not nested repos.
