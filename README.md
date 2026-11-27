# VaultAuth SSO — Frontend Web Client

> **Enterprise Single Sign-On (SSO) Portal with Multi-Factor Authentication (MFA), Active Session Telemetry, and Instant 1-Click Revocation.**

[![Project Status](https://img.shields.io/badge/Project%20Status-Active%20Development-blue.svg)](https://github.com/ABhardwaj28/vaultauth-frontend)
[![PRD Version](https://img.shields.io/badge/PRD-v2.0%20(Optimized)-success.svg)](docs/PRD_v2.0.md)
[![Track](https://img.shields.io/badge/Track-PST__PD__154%20Product%20Development-orange.svg)]()
[![Batch](https://img.shields.io/badge/Batch-2026%20Level%204%20(Stretch)-purple.svg)]()
[![Backend Service](https://img.shields.io/badge/Backend%20API-vaultauth--backend-blueviolet.svg)](https://github.com/ProPlays2312/vaultauth-backend)
[![Deployment](https://img.shields.io/badge/Deployed%20on-Vercel-black.svg)]()

---

## 1. Executive Summary

**VaultAuth SSO** is a zero-trust single sign-on (SSO) and identity access management (IAM) client application engineered for modern enterprise workforces. Built to interface with the [vaultauth-backend](https://github.com/ProPlays2312/vaultauth-backend) service, this client provides:
- **Out-of-Band MFA Verification:** Authenticates primary credentials and enforces secondary 6-digit email OTP (via Resend) or TOTP verification before issuing session tokens.
- **Active Session Telemetry & 1-Click Revocation:** Enables employees to inspect their active sessions and administrators to revoke compromised devices globally in under 30 seconds.
- **Client Security & Zero-Knowledge Transmission:** Plaintext secrets are sent over TLS directly to the server's Argon2id hashing engine; tokens are kept strictly in ephemeral memory/`sessionStorage` and dropped on any 401 error.
- **Anti-Enumeration Privacy:** Standardized generic error responses prevent account existence probing and credential enumeration.

---

## 2. Team & Project Roles

- **Frontend & Client Security Lead:** Apoorva Bhardwaj ([@ABhardwaj28](https://github.com/ABhardwaj28))
- **Backend & DevSecOps Lead:** Shaurya Jain ([@ProPlays2312](https://github.com/ProPlays2312))
- **Course Mentor:** Mahati Ma'am
- **Program:** Polaris School of Technology — On the Job Training (OJT), Semester 1

---

## 3. Product Requirements Document (PRD v2.0)

This repository strictly implements the **VaultAuth SSO PRD v2.0**, which elevates the platform from an isolated prototype to a production-grade full-stack architecture:
- 📄 **[Read PRD v2.0 (Markdown)](docs/PRD_v2.0.md)**
- 📥 **[Download PRD v2.0 (Compiled PDF)](docs/VaultAuth_SSO_PRD_v2.0.pdf)**

---

## 4. Frontend Architecture & Modern Tech Stack

### 4.1 Bun + React 18 + TypeScript + Tailwind CSS (shadcn/ui-Grade)
The client is engineered as a production-grade, enterprise-ready Single-Page Application (SPA) powered by **Bun**, **React 18**, **TypeScript**, and **Tailwind CSS**, designed with an engineered aesthetic modeled directly after **shadcn/ui** (`shadcn.com`), Linear, and Cloudflare Zero-Trust:

```text
vaultauth-frontend/
├── index.html                   # Zero-FOUC theme bootloader & semantic entrypoint
├── package.json                 # Bun/Node package manifest
├── tsconfig.json                # Strict TypeScript configuration ("strict": true)
├── vite.config.ts               # Vite configuration with React fast refresh & @ path aliases
├── tailwind.config.js           # Semantic HSL design tokens & darkMode: ["class"]
├── postcss.config.js            # PostCSS pipeline (Tailwind & Autoprefixer)
├── .env.example                 # Environment variables specification
├── docs/
│   ├── FRONTEND_PLANNER.md      # Phased delivery roadmap & component spec
│   ├── PRD_v2.0.md              # Product Requirements Document (v2.0)
│   └── VaultAuth_SSO_PRD_v2.0.pdf
└── src/
    ├── main.tsx                 # React DOM root entrypoint
    ├── App.tsx                  # Application route registry with protected guards
    ├── index.css                # Semantic HSL custom properties & theme tokens
    ├── types/
    │   └── api.ts               # Strict TypeScript contracts for all endpoints & errors
    ├── lib/
    │   ├── api.ts               # Typed fetch client, X-Request-ID & X-RateLimit-* parser
    │   └── utils.ts             # cn(), formatters, User-Agent device parser, copyToClipboard
    ├── context/
    │   ├── AuthContext.tsx       # Token persistence, /api/v1/me hydration & role helpers
    │   └── ThemeContext.tsx      # FOUC-free persistent theme state (light | dark | system)
    ├── components/
    │   ├── ui/                  # shadcn-grade primitives
    │   │   ├── button.tsx       # Accessible button with variants (default, outline, destructive, ghost)
    │   │   ├── input.tsx        # High-assurance input with focus rings
    │   │   ├── label.tsx        # Accessible form label
    │   │   ├── card.tsx         # Hairline-bordered card containers
    │   │   ├── badge.tsx        # Semantic status and role badges
    │   │   ├── alert.tsx        # Contextual notification banners
    │   │   ├── table.tsx        # Structured tabular views with uppercase mono headers
    │   │   ├── dialog.tsx       # Radix UI accessible modal dialogs
    │   │   ├── dropdown-menu.tsx# Radix UI popovers and action menus
    │   │   ├── tabs.tsx         # Radix UI accessible segmented tabs
    │   │   ├── separator.tsx    # Crisp 1px hairline dividers
    │   │   ├── collapsible.tsx  # Expandable technical JSON drawers
    │   │   ├── tooltip.tsx      # Hover technical details tooltips
    │   │   ├── otp-input.tsx    # Accessible 6-cell segmented numeric OTP input
    │   │   ├── copy-button.tsx  # 1-click clipboard copy with visual feedback
    │   │   └── ThemeToggle.tsx  # Radix dropdown theme switcher (Light / Dark / System)
    │   └── layout/
    │       ├── AuthShell.tsx    # Constrained layout for authentication views
    │       ├── DashboardShell.tsx# Unified dashboard with role-aware navigation
    │       ├── TopBar.tsx       # Brand mark, live backend telemetry pill & user status
    │       ├── RouteGuards.tsx  # Protected guards (RequireAuth, RequireAdmin, PublicOnly)
    │       └── ErrorLayout.tsx  # Standardized error layout with technical diagnostics
    └── pages/
        ├── auth/
        │   ├── LoginPage.tsx    # /login: Primary credentials with anti-enumeration handling
        │   ├── RegisterPage.tsx # /register: NIST SP 800-63B policy validator (12-128 chars)
        │   └── VerifyOtpPage.tsx# /verify-otp: 6-cell numeric OTP with 60s cooldown & attempt tracking
        ├── dashboard/
        │   ├── ProfileTab.tsx   # /dashboard/profile: User ID, role, status, and crypto specs
        │   ├── SessionsTab.tsx  # /dashboard/sessions: Active employee sessions & 1-click self-revocation
        │   └── admin/
        │       ├── AppsTab.tsx  # /dashboard/admin/apps: OAuth clients + CRITICAL One-Time Secret Reveal
        │       ├── UsersTab.tsx # /dashboard/admin/users: Directory search, 3-strike unlock & status controls
        │       ├── AuditLogsTab.tsx # /dashboard/admin/audit-logs: Security audit trail & JSON drawer
        │       └── GlobalSessionsTab.tsx # /dashboard/admin/sessions: Centralized kill-switch
        └── errors/
            ├── ForbiddenPage.tsx    # 403: ERR_FORBIDDEN (Administrator authority required)
            ├── NotFoundPage.tsx     # 404: ERR_NOT_FOUND (Missing resource or route)
            ├── RateLimitedPage.tsx  # 429: ERR_RATE_LIMITED (Live X-RateLimit-Reset countdown)
            ├── ServerErrorPage.tsx  # 500/503: Offline / gateway unreachable
            └── ErrorBoundary.tsx    # Global React ErrorBoundary wrapping root routes
```

### 4.2 Key Engineering & Security Highlights
1. **Engineered shadcn/ui Design Standards:**
   - Restrained Zinc/Slate palette driven entirely by semantic HSL CSS custom properties (`--background`, `--card`, `--primary`, `--border`, `--input`, `--ring`).
   - Visual hierarchy established through crisp `1px solid hsl(var(--border))` hairline borders and subtle surface contrast rather than heavy drop shadows or glassmorphism abuse.
   - Dual theme support (Light, Dark, and System) with zero-FOUC inline boot script.
2. **One-Time OAuth Secret Reveal Flow:**
   - When registering OAuth/OIDC relying party clients in `/dashboard/admin/apps`, the client secret is presented in a high-clarity one-time modal with copy buttons, requiring explicit user acknowledgment before dismissal.
3. **Session Governance & Centralized Kill-Switch:**
   - Both self-service session management for employees and centralized administrative termination across all global sessions with &lt;30s revocation enforcement.
4. **NIST SP 800-63B Compliant Authentication:**
   - Client-side validation enforcing 12 to 128 character password boundaries, paired with 6-digit split OTP input with paste routing, backspace auto-reverse, and 3-attempt limit tracking.
5. **Strict TypeScript & Build Verification:**
   - 100% type-checked under `"strict": true` and `"noUncheckedIndexedAccess": true`. Built with Bun in ~1s.

---

## 5. API & Service Contract (FastAPI Alignment)

The frontend communicates with [vaultauth-backend](https://github.com/ProPlays2312/vaultauth-backend) over base path `/api/v1`:

| Operation | Endpoint | Method | Client Headers / Payload |
| :--- | :--- | :---: | :--- |
| **Register Account** | `/api/v1/auth/register` | `POST` | `{ "email": "...", "password": "..." }` |
| **Email Verification** | `/api/v1/auth/verify-email` | `POST` | `{ "email": "...", "code": "123456" }` |
| **Resend Code** | `/api/v1/auth/verify-email/resend` | `POST` | `{ "email": "..." }` (capped at 3) |
| **Primary Login** | `/api/v1/auth/login` | `POST` | `{ "email": "...", "password": "..." }` |
| **Verify MFA Code** | `/api/v1/auth/mfa/verify` | `POST` | `{ "challenge_id": "...", "code": "123456" }` |
| **Sign Out** | `/api/v1/auth/logout` | `POST` | `Authorization: Bearer <token>` |
| **User Active Sessions** | `/api/v1/me/sessions` | `GET` | `Authorization: Bearer <token>` |
| **Revoke Session** | `/api/v1/sessions/{id}` | `DELETE` | `Authorization: Bearer <token>` |
| **Admin All Sessions** | `/api/v1/admin/sessions` | `GET` | `Authorization: Bearer <token>` (Admin Only) |
| **Admin Audit Trail** | `/api/v1/admin/audit-logs` | `GET` | `Authorization: Bearer <token>` (Admin Only) |
| **Admin Directory** | `/api/v1/admin/users` | `GET` | `Authorization: Bearer <token>` (Admin Only) |
| **Admin Unlock Account** | `/api/v1/admin/users/{id}/unlock` | `POST` | `Authorization: Bearer <token>` (Admin Only) |
| **Admin User Status** | `/api/v1/admin/users/{id}/status` | `PATCH` | `Authorization: Bearer <token>` (Admin Only) |
| **Admin OAuth Clients** | `/api/v1/admin/oauth/clients` | `GET` | `Authorization: Bearer <token>` (Admin Only) |
| **Admin Create OAuth** | `/api/v1/admin/oauth/clients` | `POST` | `Authorization: Bearer <token>` (Admin Only) |
| **Admin Revoke OAuth** | `/api/v1/admin/oauth/clients/{id}` | `DELETE` | `Authorization: Bearer <token>` (Admin Only) |

---

## 6. Local Development & Quickstart

```bash
# 1. Clone the repository
git clone https://github.com/ABhardwaj28/vaultauth-frontend.git
cd vaultauth-frontend

# 2. Install dependencies with Bun
bun install

# 3. Environment configuration
# Default backend points to: https://api.vaultauth.proplays2312.eu.org
cp .env.example .env

# 4. Start high-performance development server
bun dev
```
Visit `http://localhost:3000` in your web browser. Production API target: `https://api.vaultauth.proplays2312.eu.org`.

This single dev server serves the whole website: `/` renders the marketing landing page (components reused from `landing/src`), while `/login`, `/register`, `/verify-otp`, `/dashboard/*`, `/403`, `/429`, `/500`, `/privacy` and `/terms` render the identity portal. The standalone landing dev server (`cd landing && bun dev`, port 3001) is still available if you want to preview it in isolation.

---

## 7. Delivery Milestones

- [x] **Week 1:** Repository setup, PRD v2.0 optimization, responsive Bootstrap UI layout, and API adapter skeleton.
- [ ] **Week 2:** Split 6-digit OTP input, registration & email verification views, login flow, and ephemeral token handling.
- [ ] **Week 3:** Active session management table with 1-click revocation, admin audit log explorer, and Vercel deployment with CSP headers.
- [ ] **Week 4:** Cross-browser testing, mobile responsive polish (375px), WebAuthn concept card, and end-to-end demo video.

---

## 8. License

Licensed under the MIT License. Developed for academic demonstration at Polaris School of Technology.
