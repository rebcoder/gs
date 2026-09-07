# End-to-End Tests

Playwright tests covering the full buyer/seller user journey: register, log in, browse, view a sale,
book an appointment, and — as a seller — create a sale and update a profile.

## Prerequisites

1. Backend running locally first:
   ```bash
   # from the repo root
   docker compose up -d gs-back
   ```
   (or `cd gs-back && ./mvnw spring-boot:run` if you'd rather run it without Docker)
2. Playwright browsers installed once:
   ```bash
   npx playwright install chromium
   ```

## Run

```bash
npm run e2e
```

This starts the Angular dev server automatically (reusing one already running on `:4200` if present)
and runs the suite against it — the backend must already be up per the prerequisite above.

## Notes

- Tests seed demo data via the backend's `/api/test/seed-demo` endpoint (same one the app itself uses
  for local demo login) — not available when the backend runs with the `prod` Spring profile.
- Register/create-sale tests use randomized usernames/sale names per run, so the suite is safe to
  re-run without manually clearing data first.
- A trace/video is captured automatically on failure (`playwright-report/`, gitignored).
