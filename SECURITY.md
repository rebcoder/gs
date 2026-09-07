# Security Policy

GarageSale is a portfolio/demo project, not a production service handling real user data — but
security reports are still welcome and taken seriously.

## Reporting a Vulnerability

Please **do not** open a public GitHub issue for security vulnerabilities. Instead, use
[GitHub's private vulnerability reporting](../../security/advisories/new) for this repository
("Security" tab → "Report a vulnerability"). Include:

- A description of the issue and its potential impact
- Steps to reproduce (or a proof-of-concept)
- Affected version/commit

You should get an acknowledgment within a few days. There's no bug bounty — this is an unpaid
open-source project — but reports are credited unless you'd prefer otherwise.

## Known Limitations

This app intentionally ships with dev-friendly defaults that are **not safe for a real production
deployment** without changes — see `docs/ARCHITECTURE.md` (§6, Configuration & Hardening) and
`docs/KNOWN_ISSUES.md` for the current, honest list (e.g. the default JWT signing secret must be
overridden via `JWT_SECRET`, CORS origins must be restricted via `APP_CORS_ALLOWED_ORIGINS`, and the
`/api/test/**` demo endpoints are already excluded outside local development via a Spring profile).
