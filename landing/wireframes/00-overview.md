# VaultAuth SSO — Wireframe Spec Overview

> **Scope of this document set.** This is a read-only content + UI inventory of the
> existing React app at `vaultauth-frontend` (the site served at `localhost:3000`,
> titled **"VaultAuth SSO — Enterprise Identity Portal"**), followed by a forward
> design direction and ASCII wireframes for a cleaner, more professional UI.
>
> Every label, column, button and interaction recorded here is taken from the
> actual source (`src/App.tsx`, `src/components/layout/*`, `src/pages/**`,
> `src/context/*`, `src/lib/api.ts`, `src/types/api.ts`, `src/index.css`,
> `tailwind.config.js`). No features have been invented. The "After" direction is
> a proposal, clearly separated from the "Before" inventory.

---

## 1. Sitemap / Route Map

```
/                         RootRedirect  ─┬─ unauthenticated → /login
                                         └─ authenticated  → /dashboard

PUBLIC-ONLY (PublicOnly guard — redirects logged-in users to /dashboard)
├── /login                 LoginPage          — email + password sign-in, MFA hand-off
├── /register              RegisterPage       — self-service account provisioning
└── /verify-otp            VerifyOtpPage      — 6-digit email OTP / MFA challenge

PROTECTED (RequireAuth → DashboardShell)
/dashboard                 ProfileTab (index = /dashboard/profile)
├── /dashboard/profile     ProfileTab         — identity / RBAC / MFA cards
├── /dashboard/sessions    SessionsTab       — own active sessions table
├── /dashboard/settings    SettingsTab       — password / MFA / theme / revoke-all
└── /dashboard/admin/*     (RequireAdmin — non-admins → /403)
    ├── /dashboard/admin/apps        AppsTab            — OAuth/OIDC client directory
    ├── /dashboard/admin/users       UsersTab           — user governance directory
    ├── /dashboard/admin/audit-logs  AuditLogsTab       — security audit trail
    └── /dashboard/admin/sessions    GlobalSessionsTab  — directory-wide sessions

ERROR / SYSTEM
├── /403                   ForbiddenPage         — non-admin hitting admin route
├── /429                   RateLimitedPage       — cooldown with live countdown
├── /500                   ServerErrorPage       — 500 / unreachable backend
├── /privacy               PolicyUnavailablePage — "Privacy Policy Unavailable" (503)
├── /terms                 PolicyUnavailablePage — "Terms of Service Unavailable" (503)
└── *                      NotFoundPage          — catch-all 404

GLOBAL
├── ServiceUnavailablePage — rendered by AppRoutes instead of ALL routes whenever
│                            AuthContext.isServiceUnavailable === true (health probe fails)
└── ErrorBoundary          — wraps the whole app; catches render crashes → 500 crash screen

ROUTE GUARDS (src/components/layout/RouteGuards.tsx)
├── RequireAuth   : loading → full-screen Loader2 spinner; no token → /login?redirect=<path>
├── RequireAdmin  : loading → spinner; no token → /login?redirect=<path>; non-admin → /403
└── PublicOnly    : loading → spinner; authenticated → /dashboard
```

### Route / page quick reference

| # | Route | Page purpose | Guard | Shell |
|---|-------|--------------|-------|-------|
| 1 | `/` | Route based on session state | `RootRedirect` | none (spinner) |
| 2 | `/login` | Enterprise email + password sign-in; routes to OTP if MFA required | PublicOnly | AuthShell |
| 3 | `/register` | Create corporate identity with password-policy checklist | PublicOnly | AuthShell |
| 4 | `/verify-otp` | 6-digit OTP verification (MFA or registration email) | PublicOnly | AuthShell |
| 5 | `/dashboard` / `/dashboard/profile` | View own identity claims, RBAC authority, MFA policy | RequireAuth | DashboardShell |
| 6 | `/dashboard/sessions` | View + revoke own active sessions | RequireAuth | DashboardShell |
| 7 | `/dashboard/settings` | Change password, review MFA, pick theme, revoke other devices | RequireAuth | DashboardShell |
| 8 | `/dashboard/admin/apps` | Register/revoke OAuth 2.0 / OIDC clients | RequireAdmin | DashboardShell |
| 9 | `/dashboard/admin/users` | Enable/disable, unlock, promote/demote users; inspect sessions | RequireAdmin | DashboardShell |
| 10 | `/dashboard/admin/audit-logs` | Filterable, expandable security audit trail | RequireAdmin | DashboardShell |
| 11 | `/dashboard/admin/sessions` | Grouped, expandable directory-wide session revocation | RequireAdmin | DashboardShell |
| 12 | `/403` | Admin privilege required | public | ErrorLayout |
| 13 | `/404` (`*`) | Resource/endpoint not found | public | ErrorLayout |
| 14 | `/429` | Rate-limit cooldown, live countdown | public | ErrorLayout |
| 15 | `/500` | Internal/unreachable backend (`?code`, `?message`, `?req_id`) | public | ErrorLayout |
| 16 | `/privacy`, `/terms` | Policy docs under compliance review | public | ErrorLayout |
| 17 | any route | Identity gateway offline (health probe fails) | global | standalone |
| 18 | any route | Unhandled React render exception | global | ErrorLayout (via ErrorBoundary) |

---

## 2. Current Design Language ("Before" — as built)

Source: `src/index.css`, `tailwind.config.js`, `index.html`, `src/components/ui/*`.

### 2.1 Color tokens (HSL → hex as commented in `src/index.css`)

| Token | Light | Dark | Use |
|-------|-------|------|-----|
| `--background` | `#F8F9FB` | `#0F1015` | Page canvas |
| `--foreground` | `#0F172A` | `#F3F4F6` | Primary text |
| `--card` / `--popover` | `#FFFFFF` | `#171821` | Elevated surfaces |
| `--primary` | `#F6821F` (Safety Amber) | `#F6821F` | Brand, CTA, links, active nav, focus ring |
| `--primary-foreground` | `#FFFFFF` | `#FFFFFF` | Text on amber |
| `--secondary` / `--muted` | `#F1F3F6` | `#21232F` / `#1C1D27` | Subtle fills, table header wash |
| `--muted-foreground` | `#64748B` | `#94A3B8` | Secondary/caption text |
| `--accent` | `#FFF7ED` | `#21232F` | Very light amber tint |
| `--accent-foreground` | `#9A3412` | `#F3F4F6` | Accent text |
| `--destructive` | `#EF4444` | `#DC2626` | Danger buttons, error banners |
| `--border` / `--input` | `#E2E5E9` | `#272A38` | Hairlines, inputs |
| `--radius` | `0.5rem` (8px) | — | Base radius; cards override to 12px |
| Tailwind `brand.amber` | `#F6821F` | — | Literal brand hex in config |

Semantic badge colors (from `badge.tsx`): success `#10B981` family, warning
`#F59E0B` family, destructive `#EF4444`, default = primary amber tint.

### 2.2 Typography

- Sans: **Inter** (400/500/600/700), fallback `-apple-system / Segoe UI / Roboto`.
- Mono: **JetBrains Mono** (400/500/600), fallback Geist/ SFMono / Menlo.
- Loaded via Google Fonts in `index.html`.
- De facto scale: page `<h1>` `text-xl` (20px/700, tracking-tight); card title
  `text-base`→`text-lg` (16–18px/700); body/copy `text-xs` (12px); labels `text-xs`
  with many `text-[11px]` / `text-[10px]` micro-labels; mono data `text-[10px]–text-[11px]`.
- Heavy use of `uppercase tracking-wider` on badges, table headers and card
  overline labels; `font-mono tabular-nums` for IDs, IPs and timestamps.

### 2.3 Spacing & layout

- Content container: `max-w-7xl` (1280px), `px-4 sm:px-6`. Auth card: `max-w-sm`.
  Error card: `max-w-md`.
- Vertical rhythm: sections `space-y-5 / space-y-6` (20/24px), page header
  `pb-4 border-b`, grid gaps `gap-5` (20px), card padding `p-5 sm:p-6`.
- Grids: profile = 3 columns at `lg`; settings = symmetrical 2×2 at `lg`;
  admin tables inside full-width cards.
- Radius: cards `rounded-xl` (12px), controls `rounded-lg` (8px), icon tiles
  `rounded-lg`, badges `rounded` (4px).
- Top bars: fixed `h-14` (56px), `sticky top-0 z-40` for `TopBar`; sub-nav
  `py-1.5`; footers `py-4`.

### 2.4 Component vocabulary

- **Card** — white/dark surface, hairline `border-border/80`, subtle multi-layer
  shadow, and a decorative `::before` radial amber wash (`from-primary/[0.035]`).
- **Icon tile** — 40×40 `rounded-lg bg-primary/10 border border-primary/20 text-primary`,
  uses `lucide-react` icons (ShieldCheck, User, Shield, Key, Laptop, FileText, etc.).
- **Badge** — mono, uppercase, tiny; variants default/secondary/destructive/outline/
  success/warning. Often prefixed with a colored 1.5px dot.
- **Button** — `rounded-lg`, `h-8/9/10`, variants default (amber fill) / outline /
  destructive / ghost / secondary / link, `active:scale-[0.99]`.
- **Table** — mono 11–12px, `bg-muted` header, uppercase tracked headers, hover row
  wash, horizontal scroll on narrow screens, `CopyButton` for IDs.
- **Banner** — tinted (`bg-*/10 border-*/20`) inline alert with leading icon.
- **Atmosphere** — large blurred amber/destructive blob + radial gradient wash behind
  auth and error cards; radial wash also on dashboard shell.
- **Theme** — light / dark / system, driven by `.dark` class; persisted in localStorage.
- **Primitives** — Radix UI (dialog, dropdown-menu, collapsible, tooltip, slot, etc.).

### 2.5 Observations driving the redesign

1. **Very small type** — body copy at 12px and micro-labels at 10–11px; hard to scan.
2. **Dense mono-everywhere** — IDs, IPs, timestamps and even descriptive labels use
   monospace; visual hierarchy is flattened.
3. **Heavy decoration** — blurred auras + radial washes on nearly every card and shell.
4. **Aurora ambiguity** — amber is simultaneously brand, link, active state, focus and
   loading; success/danger badges compete with it.
5. **Inconsistent label casing** — some headings Title Case, many micro-labels ALL CAPS.
6. **Dense tables** — 6–7 columns with truncated mono values and tooltips everywhere.

---

## 3. Proposed Design Direction ("After")

A restrained, enterprise-clean system: keep the recognizable VaultAuth amber as an
**action/accent** color, move body text to a comfortable 14px, remove decorative
glows from data surfaces, and establish a strict type/spacing hierarchy.

### 3.1 Concrete hex palette

**Light — "Clean Workspace" (default for data screens)**

| Role | Hex | Notes |
|------|-----|-------|
| Canvas | `#F6F7F9` | Neutral, slightly cool |
| Surface | `#FFFFFF` | Cards, tables, modals |
| Surface subdued | `#F1F3F6` | Table headers, wells, hover |
| Ink / primary text | `#111827` | Headings, values |
| Ink / secondary | `#475569` | Supporting copy |
| Ink / muted | `#94A3B8` | Captions, disabled |
| Border | `#E2E8F0` | 1px hairlines |
| Border strong | `#CBD5E1` | Inputs, dividers |
| Brand (action) | `#C2410C` | Filled buttons, links (AA on white) |
| Brand bright | `#F6821F` | Accent bars, marks, dark-mode text |
| Brand wash | `#FFF4EA` | Info banners, selected rows |
| Success | `#047857` | Active / verified |
| Warning | `#B45309` | Locked / warning |
| Danger | `#B91C1C` | Destructive, errors |
| Info | `#1D4ED8` | Neutral informational |

**Dark — "Carbon Console"**

| Role | Hex |
|------|-----|
| Canvas | `#0B0F17` |
| Surface | `#121826` |
| Surface subdued | `#1B2434` |
| Ink / primary | `#F8FAFC` |
| Ink / secondary | `#CBD5E1` |
| Ink / muted | `#94A3B8` |
| Border | `#243044` |
| Brand | `#F6821F` (text `#FDBA74` on dark) |
| Brand wash | `#2A1B10` |
| Success `#34D399` · Warning `#FBBF24` · Danger `#F87171` · Info `#60A5FA` |

**Rules:** one accent (brand amber) for actions only · status color reserved for
status · focus ring `0 0 0 3px rgba(246,130,31,0.30)` · no gradients on data cards.

### 3.2 Type scale

| Name | Size / line-height | Weight | Use |
|------|-------------------|--------|-----|
| Display | 32 / 40 | 700 | Marketing hero (landing only) |
| H1 | 24 / 32 | 650 | Page title |
| H2 | 18 / 28 | 600 | Card / section title |
| H3 | 15 / 22 | 600 | Subsection |
| Body | 14 / 22 | 400 | Copy, table cells, form values |
| Small | 13 / 20 | 400/500 | Labels, hints |
| Caption | 12 / 16 | 500 | Overlines, meta |
| Mono | 12 / 18 | 400/500 | IDs, IPs, timestamps only |

Keep Inter for all prose; use JetBrains Mono **only** for machine data. Replace
"ALL CAPS MONO" overlines with title-case small semibold captions.

### 3.3 Spacing & layout system

- 4px base grid: `4 / 8 / 12 / 16 / 24 / 32 / 48`.
- Page container `max-width: 1200px`, gutters `24px` (16px on mobile).
- Page header: `24px` bottom margin + 1px border. Sections `gap: 24px`.
- Cards: `padding: 24px`, radius `12px`; controls radius `8px`; badges `6px`.
- Card grids: `gap: 20–24px`; table row height `44px`; header height `40px`.
- Top bar `64px`; auth/error cards `max-width: 420px`.
- Buttons: primary `40px`, secondary `36px`, compact/icon `32px`; `gap: 8px`.

### 3.4 Component rules

- **Button:** 1 primary per view; outline for secondary; destructive only for
  irreversible actions; spinner + "…ing" label while busy; disabled when invalid.
- **Badge:** status only; dot + label; never body copy; title-case.
- **Card:** flat white/dark surface, 1px border, no radial glow; one icon tile per
  card; footer actions right-aligned.
- **Table:** semantic column headers (title-case), `font-variant-numeric: tabular-nums`,
  right-align actions, sticky header for long lists, explicit empty state
  (icon + heading + one-line hint).
- **Banner:** tint + 4px left accent bar; icon + bold lead + plain message; dismissible
  on success/info only.
- **Forms:** label above control, 8px gap, helper text below, invalid state with
  description (not color alone), show/hide toggle inline.
- **Modal:** centered 480px, backdrop scrim, header + body + footer, destructive
  confirmation requires explicit verb button ("Confirm Revocation").
- **Navigation:** single active pill with brand text + subtle wash; admin section
  separated by labeled divider; responsive scroll on small screens.

### 3.5 Before → After rationale

| Area | Before | After | Why |
|------|--------|-------|-----|
| Body text | 12px, 10–11px micro-labels | 14px body, 12px captions | Readability / accessibility |
| Data text | Mono everywhere | Mono only for IDs/IPs/dates | Restores hierarchy |
| Surfaces | Blurred blob + radial wash on most cards | Flat surface + hairline border | Calmer, faster, more professional |
| Brand color | Amber fills, links, active, focus all at once | Filled actions + links only (darker for AA) | Clear affordance |
| Casing | Mixed Title Case / ALL CAPS | Title-case captions, uppercase only for status | Consistency |
| Tables | 10–11px, truncated + tooltip-heavy | 13–14px, tabular-nums, wider rows | Scanability |
| Cards | Uneven top icon + overline stack | Icon + title + body + footer pattern | Predictability |
| Feedback | Tinted banners with varying padding | Standard banner with accent bar | Uniformity |
| Theme | Two very different atmospheres | Same layout both themes, token swap only | Maintainability |

---

## 4. Wireframe Files in This Set

| File | Contents |
|------|----------|
| `00-overview.md` | Sitemap, before/after design language, design direction, file index (this file) |
| `01-auth-pages.md` | ASCII wireframes: `/login`, `/register`, `/verify-otp` |
| `02-dashboard.md` | ASCII wireframes: dashboard shell + `/dashboard/profile`, `/dashboard/sessions`, `/dashboard/settings` |
| `03-admin.md` | ASCII wireframes: `/dashboard/admin/apps`, `/users`, `/audit-logs`, `/sessions` (incl. modals) |
| `04-errors.md` | ASCII wireframes: `403`, `404`, `429`, `500`, service unavailable, policy unavailable (+ crash variant) |

### 4.1 ASCII notation legend

```
+----+  box / container edge        [ ]  button or control
|    |  content region              ( )  link / text action
<    >  column boundary             { }  dynamic / data-driven content
[>>]    primary (filled) button      [..] disabled / loading state
^^      annotation / note            ::  repeated rows / list
```

Wireframes show the **default desktop** layout; responsive notes appear beneath
each frame. Text inside frames mirrors real source copy wherever a label exists.
