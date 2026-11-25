# VaultAuth Landing — Architecture Notes

Mirror of `AUTH0_LANDING_PLAN.md` with implementation detail.

## Component hierarchy

```
src/
├── App.tsx                       master scroll canvas, progress bar, back-to-top
├── index.css                     tokens, grid/marquee/pulse utilities, reduced motion
├── components/
│   ├── Navbar.tsx                sticky header, three mega menus, live /health status
│   ├── Hero.tsx                  editorial column + 3D workbench (token/PKCE)
│   ├── CodeSnippetDock.tsx       shared framework example data
│   ├── StatsBanner.tsx           sliding offerings strip + four verified benchmarks
│   ├── UseCaseDecider.tsx        three-way switcher with animated preview
│   ├── InteractiveShowcase.tsx   380vh scroll-pinned four-panel security walkthrough
│   ├── ArchitectureSection.tsx   SVG circuit with four clickable specification stages
│   ├── FeaturesGrid.tsx          six cursor-spotlight pillars, each linked to :3000
│   ├── DevelopersSection.tsx     live OIDC endpoints, REST surface, client behavior
│   ├── ComparisonSection.tsx     neutral generic comparison
│   ├── PricingSection.tsx        user-driven cost estimator + capability tiers
│   ├── FaqSection.tsx            accordion with PRD-sourced answers
│   ├── CtaBanner.tsx             three conversion paths
│   ├── Footer.tsx                link columns + standards strip
│   └── ui/
│       ├── primitives.tsx        Reveal, SectionHeading, CTAs, SeeLive, BrandMark
│       ├── AnimatedCounter.tsx   in-view count-up
│       └── SpotlightCard.tsx     cursor-tracked radial highlight
```

## Visual system notes

- The page canvas is a fixed smooth gradient from `#080C14` through indigo and teal-tinted darks back to `#080C14`, with large low-opacity amber, indigo, emerald, and magenta radial blobs blended behind transparent sections.
- The quickstart section follows Auth0's information format (segmented framework switcher, terminal, copy cards) but uses the VaultAuth palette rather than a purple stage.
- Mobile: grid templates use `minmax(0, …)` and fluid type (`clamp`) to prevent intrinsic min-content overflow. Below `sm`, benchmark and architecture rows become two-column pairs, the closing CTA cards stack, and the mobile menu is fully opaque. Horizontal control strips (framework switcher, marquee) stay horizontal and scroll if needed.

## Interaction model

- **Entrance**: one `Reveal` primitive (opacity + 18px Y, `once: true`) shared across sections.
- **Hero workbench**: `useScroll` drives `rotateX 10° → 0°` and `scale 0.98 → 1`; tabs swap with `AnimatePresence`.
- **PKCE generator**: Web Crypto SHA-256 → Base64URL, real discovery endpoint strings, four-step animated handshake.
- **Arched ribbon**: four numbered circular buttons positioned along a dome; active one uses a spring-shared orange fill (`layoutId="chamber-orbit"`). The detail panel sits partly inside the arch. No scroll pinning.
- **Reduction**: `useReducedMotion` disables transforms and reveals; CSS stops marquee/pulse under `prefers-reduced-motion`.

## Data honesty rules

1. Every number or capability has a PRD section, FR/BR rule, OpenAPI endpoint, or live portal screen behind it (see claim source map in the root plan).
2. No invented partners: the sliding strip lists VaultAuth's own offerings.
3. No unsupported product claims: WebAuthn is labelled a concept, SDKs are labelled examples, capacity numbers are labelled illustrative.
4. Each feature card carries a `SeeLive` link to the exact portal route where the capability is visible.

## PRD specifications surfaced on the page

- Registration: NIST SP 800-63B 12–128 char policy, PENDING → ACTIVE after email code.
- Login: uniform `ERR_INVALID_CREDENTIALS`, no enumeration.
- 2FA: 6-digit email OTP via Resend, 10-minute expiry, 3 attempts, 60-second resend; optional TOTP.
- Sessions: 256-bit opaque token, SHA-256 hash only, 30-minute idle / 8-hour absolute, next-request revocation.
- Lockout: 3 failures → 300 seconds, atomic counter, admin unlock.
- Audit: immutable events, event filters, JSON drawer, XSS sanitization, 30-day purge.
- Database: private `vaultauth` schema, `vault_app` / `vault_migrator` / `vault_backup` roles, Supabase primary + Neon standby.
- Client: sessionStorage token hygiene, request-ID / rate-limit headers, slow-start notice, CSP and hardened response headers, diagnostic error pages.

## Diagnostics fixed

- **CORS**: `vite.config.ts` proxies `/va-api` to the live API; `src/lib/liveApi.ts` routes `/health` and JWKS fetches through it in dev and caches results so React StrictMode does not duplicate requests.
- **Live state**: navbar now shows "Service healthy"; hero shows the real JWKS `kid`.
- **Clipboard**: `src/lib/clipboard.ts` falls back to `execCommand`, and every copy control reports Copied / Try again.
- **Quickstarts**: the terminal renders the actual framework `code` string from the shared data, with a copy-code action.
- **Accessibility**: hero tabs have `aria-label`, walkthrough rail markers stay opaque while labels fade, contrast was raised on muted text and solid amber surfaces via an explicit `va-amber-ink` utility, and the header CTA/brand stay white. Lighthouse: Accessibility 1.0, Best Practices 1.0, SEO 1.0.
- **SEO**: `public/robots.txt` added.
- **Navbar**: mega-menu panel background used an invalid Tailwind opacity step (`/98`), so it rendered transparent; changed to a header-matched `bg-[#080C14]/95` with a 420ms balanced ease-in-out height reveal and a slightly stronger resting header (`/60`). The panel now stays mounted while its inner content crossfades (180ms), and the active nav highlight slides between items with a shared-layout spring.
- **Refinements**: use-case active pill uses end-matched corner radii; the cost amount scales its font size with digit count (₹ stays attached), tabular numerals are used throughout, the yearly label was shortened to "Billed yearly at ₹…", and estimator borders were softened.
- **Navigation**: top-level nav items and all mega-menu links are internal section anchors on this page; the hero "3 strikes" badge moved into normal flow so it no longer overlaps the workbench.
- **Marquee**: built from two equal-width padded groups so `translateX(-50%)` lands exactly on the seam; hover-pause removed and GPU hints added for a continuous loop.
- **Docs/status CTAs**: documentation buttons point to `DOCS_LINK` (`/403.html`) until a public docs site exists; `/status.html` runs live health/JWKS checks in an Atlassian-style view. No repository links are shown in the UI.
- **Mobile**: horizontal strips keep their row and show a swipe hint; no page overflow from 320px to 1440px.

## Port note

The original dev server was bound to `[::1]:3001`, unreachable from the in-app browser. Run:

```bash
cd "Desktop/OJT SEM 1/vaultauth-landing"
npx vite --host 0.0.0.0 --port 3001
```

Then open `http://127.0.0.1:3001`. The identity app runs on `http://localhost:3000`.
