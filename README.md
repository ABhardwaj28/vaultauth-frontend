# VaultAuth SSO — Frontend Web Client

> **Enterprise Single Sign-On (SSO) Portal with Multi-Factor Verification, Active Session Telemetry, and Instant 1-Click Revocation.**

[![Project Status](https://img.shields.io/badge/Project%20Status-Active%20Development-blue.svg)](https://github.com/ABhardwaj28/vaultauth-frontend)
[![PRD Version](https://img.shields.io/badge/PRD-v2.0%20(Optimized)-success.svg)](docs/PRD_v2.0.md)
[![Track](https://img.shields.io/badge/Track-PST__PD__154%20Product%20Development-orange.svg)]()
[![Batch](https://img.shields.io/badge/Batch-2026%20Level%204%20(Stretch)-purple.svg)]()
[![Backend Service](https://img.shields.io/badge/Backend%20API-vaultauth--backend-blueviolet.svg)](https://github.com/ProPlays2312/vaultauth-backend)
[![Deployment](https://img.shields.io/badge/Deployed%20on-Vercel-black.svg)]()

---

## 1. Executive Summary

**VaultAuth SSO** is a zero-trust single sign-on (SSO) and identity access management (IAM) client application engineered for modern enterprise workforces. Built to interface with the [vaultauth-backend](https://github.com/ProPlays2312/vaultauth-backend) service, this client provides:
- **Out-of-Band 2FA Verification:** Authenticates primary credentials and enforces secondary 6-digit email OTP (via Resend) or TOTP verification before issuing session tokens.
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

## 4. Frontend Architecture & Client Engineering

### 4.1 Single-Page Application (SPA) Views
The client is structured as a fast, accessible, lightweight Vanilla JavaScript Single-Page Application without heavy framework bloat:

```text
vaultauth-frontend/
├── index.html                # Semantic HTML5 entrypoint with view containers
├── vercel.json               # Production CSP, SRI, and security response headers
├── docs/
│   ├── PRD_v2.0.md           # Product Requirements Document (v2.0)
│   └── VaultAuth_SSO_PRD_v2.0.pdf
├── css/
│   └── style.css             # Enterprise dark-mode styling, status pills, OTP inputs
├── js/
│   ├── app.js                # Hash router and view coordinator
│   ├── api.js                # Dual-mode API adapter (Mock <-> Live Backend)
│   ├── auth.js               # Token lifecycle, session state, and auth guards
│   ├── ui.js                 # DOM manipulators, spinners, modals, toasts
│   └── components/
│       ├── otpInput.js       # Auto-advancing split 6-digit numeric input
│       ├── countdownTimer.js # Visual countdown ring for OTP expiry & lockout
│       ├── sessionTable.js   # Active session manager with 1-click revocation buttons
│       └── auditTable.js     # Admin audit log explorer with event filter
└── sample-data.json          # Pre-seeded identities for offline testing
```

### 4.2 Key Frontend UX & Security Features
1. **Split 6-Digit OTP Box Component:**
   - 6 individual numeric inputs with auto-advance, backspace auto-reverse, and clipboard paste routing (e.g. pasting `"849201"` fills all boxes and submits automatically).
2. **Cold-Start Resilience Toast:**
   - When communicating with the Render free-tier container during a wake-up cycle (> 2.0s response), an elegant non-blocking status banner informs the user: *"Connecting to VaultAuth cloud service (waking container)..."* to prevent frustration or repeated clicks.
3. **Defense-in-Depth XSS Prevention:**
   - Zero `innerHTML` with server-supplied attributes (user emails, device names, IPs, audit metadata). All dynamic strings are rendered through `element.textContent` and DOM node construction.
4. **Strict Content Security Policy (`vercel.json`):**
   - Configured with `default-src 'self'`, `script-src 'self'`, and `connect-src` limited to the production API origin, blocking malicious cross-origin exfiltration.
5. **Interactive WebAuthn/FIDO2 Concept Card:**
   - Reading-only modal illustrating public-key cryptography and biometric authentication workflows to satisfy stretch learning requirements.

---

## 5. API & Service Contract (FastAPI Alignment)

The frontend communicates with [vaultauth-backend](https://github.com/ProPlays2312/vaultauth-backend) over base path `/api/v1`:

| Operation | Endpoint | Method | Client Headers / Payload |
| :--- | :--- | :---: | :--- |
| **Register Account** | `/api/v1/auth/register` | `POST` | `{ "email": "...", "password": "..." }` |
| **Email Verification** | `/api/v1/auth/verify-email` | `POST` | `{ "email": "...", "code": "123456" }` |
| **Resend Code** | `/api/v1/auth/verify-email/resend` | `POST` | `{ "email": "..." }` (capped at 3) |
| **Primary Login** | `/api/v1/auth/login` | `POST` | `{ "email": "...", "password": "..." }` |
| **Verify 2FA Code** | `/api/v1/auth/2fa/verify` | `POST` | `{ "challenge_id": "...", "code": "123456" }` |
| **Sign Out** | `/api/v1/auth/logout` | `POST` | `Authorization: Bearer <token>` |
| **User Active Sessions** | `/api/v1/me/sessions` | `GET` | `Authorization: Bearer <token>` |
| **Revoke Session** | `/api/v1/sessions/{id}` | `DELETE` | `Authorization: Bearer <token>` |
| **Admin All Sessions** | `/api/v1/admin/sessions` | `GET` | `Authorization: Bearer <token>` (Admin Only) |
| **Admin Audit Trail** | `/api/v1/admin/audit-logs` | `GET` | `Authorization: Bearer <token>` (Admin Only) |

---

## 6. Local Development & Quickstart

```bash
# 1. Clone the repository
git clone https://github.com/ABhardwaj28/vaultauth-frontend.git
cd vaultauth-frontend

# 2. Run locally with any static web server
# Option A: Python
python3 -m http.server 3000

# Option B: Node / npx
npx serve .
```
Visit `http://localhost:3000` in your web browser.

---

## 7. Delivery Milestones

- [x] **Week 1:** Repository setup, PRD v2.0 optimization, responsive Bootstrap UI layout, and API adapter skeleton.
- [ ] **Week 2:** Split 6-digit OTP input, registration & email verification views, login flow, and ephemeral token handling.
- [ ] **Week 3:** Active session management table with 1-click revocation, admin audit log explorer, and Vercel deployment with CSP headers.
- [ ] **Week 4:** Cross-browser testing, mobile responsive polish (375px), WebAuthn concept card, and end-to-end demo video.

---

## 8. License

Licensed under the MIT License. Developed for academic demonstration at Polaris School of Technology.
