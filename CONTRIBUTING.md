# Contributing to GarageSale

Thanks for considering a contribution! This is a small open-source portfolio project, so the process
is intentionally lightweight.

## Getting Set Up

See the root [`README.md`](README.md) for local dev setup (Docker Compose + Angular dev server) and
[`AGENTS.md`](AGENTS.md) for a fast architectural orientation.

## Workflow

1. Fork the repo and create a branch off `main` (`git checkout -b feature/short-description`).
2. Make focused changes — smaller PRs are easier to review.
3. Run the relevant test suite(s) before opening a PR:
   - Backend: `cd gs-back && ./mvnw test`
   - Frontend: `cd gs-front && npx ng test --watch=false --browsers=ChromeHeadless`
   - Frontend build: `cd gs-front && npx ng build --configuration production --progress=false`
4. Update docs under `docs/` if you change behavior, config, or architecture.
5. Open a pull request describing what changed and why. Link any related issue.

## Code Style

- **Backend**: standard Spring Boot conventions — controllers stay thin, business logic in services,
  DTOs at the API boundary, bean validation (`@Valid`) on inbound request bodies.
- **Frontend**: standalone Angular components, shared UI primitives live in
  `gs-front/src/app/components/ui/*` — reuse them rather than hand-rolling new styled elements. Prefer
  the design tokens in `gs-front/src/styles.scss` over hardcoded colors/spacing.
- Avoid introducing `any` in TypeScript where a real type is easy to express.

## Reporting Bugs / Requesting Features

Use the GitHub issue templates. For security-sensitive reports, see [`SECURITY.md`](SECURITY.md)
instead of opening a public issue.

## Code of Conduct

This project follows the [Code of Conduct](CODE_OF_CONDUCT.md) — please be respectful and
constructive in issues, PRs, and discussions.
