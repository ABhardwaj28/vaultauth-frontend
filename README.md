# VaultAuth SSO — Frontend Client

> **Enterprise Single Sign-On (SSO) Portal with Client-Side Hashing, Mock 2FA OTP Verification, and Active Session Revocation.**

[![Status](https://img.shields.io/badge/Project%20Status-Active%20Development-blue.svg)](https://github.com/ABhardwaj28/vaultauth-frontend)
[![Track](https://img.shields.io/badge/Track-PST__PD__154%20Product%20Development-orange.svg)]()
[![Batch](https://img.shields.io/badge/Batch-2026%20Level%204%20(Stretch)-purple.svg)]()
[![Backend Repo](https://img.shields.io/badge/Backend%20Repo-vaultauth--backend-success.svg)](https://github.com/ProPlays2312/vaultauth-backend)

---

## 1. Project Overview

**VaultAuth SSO** is a streamlined cybersecurity authentication portal engineered for enterprise teams requiring robust single sign-on (SSO), client-side cryptographic hashing, two-factor authentication (2FA) simulation, and real-time session management without the overhead of massive OAuth2/OIDC server infrastructure.

- **Theme:** Identity & Access Management (IAM), Zero-Trust Architecture
- **Industry:** Cybersecurity
- **Core Value Proposition:** Hashed credential verification, 2FA OTP simulation, and active session revoking in under 30 seconds.

---

## 2. Problem Statement & Solution

### The Challenge
- **Cleartext Credential Risks:** Many entry-level and legacy authentication platforms persist unhashed or poorly secured credentials, exposing organizations to credential stuffing and data breach hazards.
- **Absence of 2FA Workflows:** Lack of secondary challenge gates allows compromised passwords to result directly in unauthorized account access.
- **Session Persistence & Hijacking:** Employees leave sessions active across unmanaged devices, and administrators lack a centralized mechanism to inspect and terminate compromised sessions instantly.

### The VaultAuth SSO Solution
1. **Client-Side SHA-256 Hashing:** Plaintext passwords are never stored or transmitted raw. Secrets are transformed into 64-character SHA-256 hexadecimal digests via the Web Cryptography API (`crypto.subtle`).
2. **Two-Factor Authentication (2FA OTP) Simulation:** Successful credential matching triggers a time-limited 6-digit mock OTP challenge screen.
3. **Session Revocation & Telemetry:** Enterprise administrators can view live session details (device, client IP, timestamp) and terminate any session with 1-click instant revocation.
4. **Brute-Force Guard:** 3 consecutive invalid attempts automatically lock the target account for 5 minutes.

---

## 3. Frontend Architecture & Optimization Strategy

This repository contains the standalone, responsive web frontend for **VaultAuth SSO**. It is optimized according to the following design principles:

### A. Pluggable Service Adapter Layer (Mock-to-Backend Transition)
To guarantee zero friction when integrating with the [vaultauth-backend](https://github.com/ProPlays2312/vaultauth-backend), the frontend isolates all state and API operations inside an abstract service adapter (`apiService.js`):
- **Local/Mock Mode:** Operates using browser `localStorage` seeded with standard `sample-data.json`, enabling standalone demonstration and offline testing.
- **Live Backend Mode:** Enables seamless redirection to the REST endpoints exposed by `vaultauth-backend` with standard `fetch()` calls and Bearer token handling.

### B. Security & Cryptographic Hardening
- **Zero Raw Secret Exposure (BR-01):** Raw passwords never reach `localStorage` or `console.log`.
- **SubtleCrypto Fallback Engine:** Implements a pure JS SHA-256 digest fallback for non-secure testing contexts (e.g. non-HTTPS, LAN IPs) where `window.crypto.subtle` is restricted.
- **Strict DOM Sanitization (XSS Defense):** All dynamic strings (emails, device names, IP addresses, audit events) are sanitized before insertion into the DOM.
- **Defensive Account Lockout (BR-03):** Client-side lockout timer state persists across reloads to prevent brute-force retries.

### C. Enterprise UX & Responsive Design
- **Responsive Layout:** Built with Bootstrap 5 and custom cybersecurity dark/light styling, fluidly tested across mobile viewports (375px) to desktop displays (1440px).
- **Split 6-Digit OTP Input:** Optimized OTP entry with auto-focus jumping, backspace navigation, and clipboard paste support.
- **Interactive Evaluation Toast:** Includes an opt-in evaluation toast showing generated mock OTPs for rapid grading and assessment.
- **Role Switcher & Quick Demo State Reset:** Fast-switch toggle between **End User** and **Enterprise Admin** views, with a "Reset Demo Directory" button to reseed initial identity records.
- **WebAuthn / FIDO2 Concept Card:** Reading-only stretch architectural card explaining hardware security keys and passwordless standards.

---

## 4. Roles & Capabilities Matrix

| Capability | End User (Employee) | Enterprise Admin |
|:---|:---:|:---:|
| **Select Active Role (Demo Sign-In)** | Yes | Yes |
| **Register New Account (Email + Hashed Password)** | Yes | Yes |
| **Authenticate with 2FA Mock OTP** | Yes | Yes |
| **View Own Active Sessions & Digital ID Card** | Yes | Yes |
| **Revoke Any User Session** | No | **Yes** |
| **View Global Security Audit Log** | No | **Yes** |
| **Reset SSO Portal State (Demo)** | Yes | Yes |

---

## 5. API & Service Contract

The frontend implements and communicates with the backend via the following standard contracts:

```typescript
// 1. User Registration
registerUser(email: string, plainPassword: string): Promise<UserRecord>
// Error codes: ERR_DUPLICATE_EMAIL, ERR_WEAK_PASSWORD

// 2. Primary Credential Verification
authenticateUser(email: string, plainPassword: string): Promise<OTPChallengeState>
// Error codes: ERR_INVALID_CREDENTIALS, ERR_ACCOUNT_LOCKED

// 3. Mock 2FA OTP Validation
verifyOTP(userId: string, inputOtp: string): Promise<SessionTokenResponse>
// Error codes: ERR_INVALID_OTP

// 4. Session Termination
revokeSession(adminUser: string, sessionId: string): Promise<RevocationResult>
// Error codes: ERR_FORBIDDEN, ERR_NOT_FOUND
```

---

## 6. Planned Directory Structure

```text
vaultauth-frontend/
├── .gitignore                # Git ignore rules for OS, IDE, and build caches
├── README.md                 # Complete system documentation and roadmap
├── index.html                # Single-page enterprise SSO portal interface
├── css/
│   └── style.css             # Enterprise styling, modern dark/light themes, OTP pins
├── js/
│   ├── app.js                # Core controller and event orchestration
│   ├── crypto.js             # SubtleCrypto SHA-256 wrapper & fallback
│   ├── api.js                # Abstract Adapter (Mock LocalStorage <-> Live Backend)
│   ├── session.js            # Active session tracking and device fingerprinting
│   ├── audit.js              # Security event logger with XSS-safe DOM output
│   └── ui.js                 # DOM views, OTP inputs, toasts, and modal handlers
└── sample-data.json          # Pre-seeded users, active sessions, and audit logs
```

---

## 7. Paired Backend Repository

- **Repository:** [https://github.com/ProPlays2312/vaultauth-backend](https://github.com/ProPlays2312/vaultauth-backend)
- **Collaboration Flow:** As the backend specification is updated and endpoints are landed in `vaultauth-backend`, this frontend repository will consume the live endpoints via its `api.js` adapter.

---

## 8. Development & Quickstart (Upcoming Stage)

Once the frontend code is committed in the next stage:
1. Clone the repository:
   ```bash
   git clone https://github.com/ABhardwaj28/vaultauth-frontend.git
   cd vaultauth-frontend
   ```
2. Run locally via any static HTTP server:
   ```bash
   # Using Python 3
   python3 -m http.server 3000

   # Or using Node/npx
   npx serve .
   ```
3. Open `http://localhost:3000` in your browser.

---

## 9. Milestones & Delivery Schedule

- [x] **Week 1 (Current):** Git repository initialization, comprehensive documentation, frontend architecture optimization, `.gitignore` setup.
- [ ] **Week 2:** Bootstrap UI views, SHA-256 WebCrypto integration, user registration, primary login, and mock 2FA OTP flow.
- [ ] **Week 3:** Account lockout mechanism (3 failed attempts), session revocation manager, integration with `vaultauth-backend`.
- [ ] **Week 4:** End-to-end security audit, test script verification, GitHub Pages / Vercel deployment, demonstration walkthrough.

---

## 10. Contributors & Sign-off

- **Frontend Lead:** Apoorva Bhardwaj ([@ABhardwaj28](https://github.com/ABhardwaj28))
- **Backend Lead:** Shaurya Jain ([@ProPlays2312](https://github.com/ProPlays2312))
- **Program:** On the Job Training (OJT) — Semester 1
- **Track ID:** `PST_PD_154`
