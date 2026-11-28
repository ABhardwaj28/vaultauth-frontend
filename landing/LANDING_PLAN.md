# VaultAuth Landing Page — Architectural Blueprint (Implemented)

Target: `http://127.0.0.1:3001` (Vite, `--host 0.0.0.0`)
Identity runtime: `http://localhost:3000` (`vaultauth-frontend`)
Design direction: a restrained enterprise identity console.

## Design tokens

| Token | Value | Duty |
| --- | --- | --- |
| Obsidian Canvas | `#080C14` | Page canvas |
| Surface Slate | `#0E1420` | Panels, cards, workbench |
| Border Steel | `#1E2838` | Hairlines, dividers |
| Signal Amber | `#F6821F` | Primary actions, active states |
| Verified Emerald | `#10B981` | Live health, verification marks |

Type: **Plus Jakarta Sans** (display + body), **JetBrains Mono** (code, terminal data only).
Copy: sentence case, active voice, no trailing arrows, no middle-dot meta strings, solid white headlines.
No announcement ribbon. Motion: one scroll-progress bar, one entrance language, scroll-linked workbench, 380vh scroll-pinned security storyboard. The 220vh scroll-scrub manifesto paragraph was removed at the user's request.

## Claim source map (truth pass)

Every technical claim is cross-checked against the PRD PDF/markdown, the live OpenAPI document, and the running portal at `localhost:3000`. The landing cards link directly to the portal route where each capability can be seen.

| Claim on the page | PRD specification | Where it appears at :3000 |
| --- | --- | --- |
| 12–128 char password policy | FR-01, section 9.1 (`RegisterPage.tsx`, NIST SP 800-63B validator) | `/register` — email, master password, confirm password |
| Argon2id, `m=65536, t=3, p=4`, DB constraint | Section 2 D1, 6.1, 9.3, BR-01, schema `users_hash_argon2` | `/dashboard/profile` identity and crypto metadata; `/dashboard/settings` password change |
| Registration PENDING until email verified, 6-digit code, 10 min, 3 tries, resend capped at 3 then 15 min cooldown | FR-01, FR-02, section 6.1, section 8.2 | `/register`, then verification challenge |
| Uniform 401 `ERR_INVALID_CREDENTIALS`, no user/lockout enumeration | FR-03, BR-05, section 2 D4 | `/login` — identical failure state |
| Mandatory email OTP via Resend, 6 digits, 10 min expiry, 3 tries, 60 s resend | FR-04, BR-02, 9.3, 9.4.1 | `/verify-otp` — "Attempts: 3 of 3 left", "Resend in 60s", "Verify & Proceed"; `/dashboard/settings` shows 10-minute code validity |
| Optional TOTP enrollment and hashed recovery codes | FR-11, RBAC row, 9.3 | `/dashboard/settings` shows enforced email OTP; TOTP is documented as optional |
| Opaque 256-bit token, only SHA-256 hash stored, sessionStorage hygiene | FR-05, BR-06, 9.4.3, `sessions_tok_hex` | Session lifecycle; token never displayed in the portal |
| 30-minute idle, 8-hour absolute expiry | FR-05, 8.3, 9.3 | `/dashboard/profile` — Idle Session Timeout 30 Minutes, Absolute Session Cap 8 Hours |
| 3 failed passwords → LOCKED for 300 s, atomic counter, admin unlock | FR-06, BR-03, 8.3, 9.3.4 | `/dashboard/profile` — "3 Consecutive Strikes"; `/dashboard/admin/users` unlock control |
| Self / admin session revocation, next-request rejection, disable ends all sessions | FR-07, BR-04, BR-10, 9.3.2 and 9.3.6 | `/dashboard/sessions` and `/dashboard/admin/sessions` — revoke buttons and "terminates its token in the authentication directory" |
| Immutable audit events, event filters, JSON drawer, XSS sanitization | FR-08, 9.3.5, schema `audit_logs` | `/dashboard/admin/audit-logs` — event filter, fetch limit, timestamp/IP table |
| Role-gated admin capabilities, public registration always `user` | Section 5 RBAC matrix, BR-09, BR-10 | Admin nav appears for `shaurya@example.com`; absent for `apoorva@example.com` |
| OAuth client registry, redirect URIs, scopes, one-time secret with acknowledgement | 9.3.3, FR API `POST /admin/oauth/clients` | `/dashboard/admin/apps` — "Register Application", client table, one-time secret dialog |
| OIDC discovery, JWKS, RS256, PKCE S256, authorize/token/userinfo/revoke | Live `/.well-known/openid-configuration` + `/.well-known/jwks.json` | `/dashboard/admin/apps` registers relying parties; API endpoints are external |
| Health | Live `/health` → `{status: ok}`; the page checks availability from the browser before claiming it | Status page, navbar badge, and developers section |
| PostgreSQL roles, Supabase primary + Neon standby, failover revokes sessions, 30-day purge | Section 8.1, 10, BR-07, BR-08, BR-11 | Backend only; documented in architecture and FAQ |
| CSP, X-Frame-Options DENY, nosniff, referrer policy, error pages with rate-limit countdown | 9.4.2, 9.4.4, 9.4.5 | Developers section and FAQ |

Deliberately excluded as unsupported: sub-millisecond Redis revocation, sub-15 ms JWKS benchmark, real WebAuthn/FIDO2 login, SAML/SCIM federation, India data-residency certification, 99.999% SLA, attack-block counters, invented partner logos, published SDK packages, and hard ₹ prices. The sliding marquee lists VaultAuth's own verified offerings instead of claiming customers we do not have. WebAuthn is labelled an architecture concept; framework snippets are labelled illustrative. PRD items explicitly scoped as optional or cut (TOTP, Expo ID card, Neon sync) are described as optional or not shown.

## Section map

1. `Navbar` — floating header, mega menus, live health pill, no ribbon.
2. `Hero` — editorial copy + 3D workbench: token inspector and real S256 PKCE generator.
3. `StatsBanner` — ecosystem marquee + truthful benchmarks.
4. `UseCaseDecider` — B2C / B2B / machine-client switcher with morphing preview.
5. `InteractiveShowcase` — 380vh scroll-pinned, four-panel security walkthrough driven by a DOM-targeting cursor: password entry, six-digit OTP with timer, session revocation with audit line, and an OAuth client registry. The tick appears only after OTP success; the registry panel has no cursor.
6. `ArchitectureSection` — SVG circuit with clickable spec HUD.
7. `FeaturesGrid` — six cursor-spotlight pillars.
8. `DevelopersSection` — live endpoint list and discovery facts.
9. `QuickstartSection` — standalone gradient stage with segmented framework switcher, terminal, and copy cards.
10. `ComparisonSection` — neutral generic comparison.
11. `PricingSection` — capability tiers only: Developer is self-hosted-only with a documentation CTA; Team, Scale and Sovereign are managed or self-hosted with a team CTA. The editable cost estimator lives on the standalone `/pricing.html` page opened from the top Pricing link. No published or invented prices.
12. `FaqSection` — five honest technical answers, all closed by default.
13. `CtaBanner` + `Footer` — three conversion paths, standards strip, status page link.
14. `/status.html` — Atlassian-style live health/JWKS checks; `/403.html` — temporary documentation page; `/pricing.html` — standalone cost estimator.

## Decisions taken (no answers were supplied, so plan defaults were used)

- Unsupported claims: **removed**, not softened.
- Pricing: the estimator is a standalone `/pricing.html` page; the landing only lists capability tiers. No invented or published currency values.
- Comparison: generic alternatives, no named vendors.
- Scope: the landing lives only in `landing/`; the original frontend app is untouched and obsolete `src/redesign/*` files are excluded. A few deployment-support files (`src/landing.css`, `public/status.html`, `public/403.html`, `public/robots.txt`) are mirrored at the repo root for the static production build.
- Port: dev server run with `--host 0.0.0.0` on port 3001 so `127.0.0.1:3001` is reachable; portal CTAs resolve to `localhost:3000` in development and same-origin routes in production.

## Verification

`npm run build` (TypeScript strict + Vite) and browser walkthrough at desktop and mobile widths.
