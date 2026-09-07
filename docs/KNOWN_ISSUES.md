# Known Issues

Short list of known gaps and cosmetic quirks — not a full audit, just what's still open. See also
`AGENTS.md` for the broader "what this project intentionally doesn't do" framing.

## Still Out of Scope

- **Real RBAC** — actual `Role`/authorities assigned at registration plus `@EnableMethodSecurity`.
  Current authorization uses pragmatic identity/ownership checks (e.g. a buyer can only see/cancel
  their own appointments) instead of role-based policy, which closes the concrete data-leak/tamper
  risks without the larger rework.
- **A full `any` → strict-typing pass** across every frontend component — only the service layer
  (`sales.service.ts`, `appointment.service.ts`, `auth.service.ts`) has real interfaces today.
- **Password reset / social login** — the dead UI affordances for these were removed rather than
  implemented; there's no working flow for either.

## Known Minor Issues (Cosmetic)

- `profile`/`my-sales` pages have a slightly heavy pale-pink card background wash rather than a clean
  white surface — on-brand but a bit saturated; cosmetic only.
- A dev-mode-only `NG0100: ExpressionChangedAfterItHasBeenCheckedError` console warning fires on
  `AppComponent` during initial load (Angular's strict double-check). Doesn't occur in production
  builds and doesn't affect functionality.
- The home page's "N garage sales happening near you this weekend" banner can show `0` while a
  featured sale is still listed below it (the banner count and the featured-sale list use different
  filter windows) — a copy/logic mismatch, not a broken feature.

## Self-Hosting Caveats

- The rate limiter (`docs/ARCHITECTURE.md` §6) is in-memory and per-instance — if you run multiple
  backend replicas behind a load balancer, limits are enforced per-replica, not globally. A
  Redis-backed distributed limiter would be needed for that setup.
- CORS defaults to `http://localhost:4200`. If you deploy the frontend anywhere else, set
  `APP_CORS_ALLOWED_ORIGINS` explicitly — never leave it wildcarded.
- The built-in JWT signing secret is a dev-only fallback. Always set `JWT_SECRET` yourself before
  running this anywhere reachable beyond your own machine.
