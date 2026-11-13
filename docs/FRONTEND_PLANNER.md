# VaultAuth SSO — Frontend Implementation Planner

## Executive Summary
This planner outlines the step-by-step frontend implementation roadmap for **VaultAuth SSO** (Track: `PST_PD_154`), tailored directly to the live backend API deployed at **`https://api.vaultauth.proplays2312.eu.org/`**.

The frontend is engineered as a zero-dependency, high-assurance Single Page Application (SPA) using **Vanilla JavaScript (ES6 Modules)**, **Bootstrap 5.3**, and an enterprise cybersecurity dark-mode design system.

---

## 1. System Topology & Architecture

```mermaid
flowchart TD
    subgraph Client["Frontend Client (vaultauth-frontend)"]
        UI["DOM View Router (app.js)"]
        API_LAYER["API Service Adapter (js/api.js)"]
        SESSION_STORE["Ephemeral Token Storage (sessionStorage)"]
        COMPONENTS["Modular UI Components (Modals, Tables, Spinners)"]
    end

    subgraph Backend["Live Backend Service (vaultauth-backend)"]
        GATEWAY["Cloudflare Proxy / Render Container"]
        CORE_API["FastAPI /api/v1/auth/*"]
        SESSION_API["FastAPI /api/v1/me/sessions & /api/v1/sessions/*"]
        ADMIN_API["FastAPI /api/v1/admin/*"]
        OIDC_ENGINE["OAuth 2.0 / OIDC Identity Provider"]
    end

    UI --> API_LAYER
    API_LAYER -->|Bearer Token & JSON Payloads| GATEWAY
    GATEWAY --> CORE_API
    GATEWAY --> SESSION_API
    GATEWAY --> ADMIN_API
    GATEWAY --> OIDC_ENGINE
    API_LAYER <--> SESSION_STORE
    UI --> COMPONENTS
```

---

## 2. Phased Implementation Roadmap

```mermaid
gantt
    title VaultAuth SSO — Frontend Delivery Schedule
    dateFormat  YYYY-MM-DD
    section Phase 1: Foundation
    Scaffolding, Theme & Health Ping       :active, p1, 2026-11-13, 2d
    section Phase 2: Core Auth
    Registration, Login & Token State      :p2, after p1, 3d
    section Phase 3: Sessions
    User Profile, Active Sessions & Kill-Switch :p3, after p2, 3d
    section Phase 4: Admin
    Admin Console, Audit Logs & User Control:p4, after p3, 4d
    section Phase 5: OIDC & Polish
    OIDC Demo, WebAuthn Card & CSP Headers :p5, after p4, 3d
```

### Phase 1: Foundational Scaffolding & Live Connectivity *(Current Stage)*
- [x] **Repository & Documentation:** Initialized `vaultauth-frontend` on GitHub with PRD v2.0.
- [x] **Backend Live Discovery:** Analyzed OpenAPI 3.1.0 schema on `api.vaultauth.proplays2312.eu.org`.
- [x] **Semantic Markup Skeleton:** `index.html` with responsive Bootstrap 5 layout and cybersecurity navigation header.
- [x] **Design Tokens & Theme:** Custom cyber dark-mode variables (neon accents, high-contrast badges, glowing status indicators).
- [x] **Live Health Handshake:** Client initializes a lightweight ping to `GET /health` and displays a dynamic "API: Connected" badge in the UI.

### Phase 2: Core Authentication & Token Lifecycle
- [ ] **Registration Form:** Implements `POST /api/v1/auth/register` with client-side password policy validation (min 12 chars).
- [ ] **Login Form:** Implements `POST /api/v1/auth/login`, receives Bearer token and role (`user` vs `admin`).
- [ ] **Ephemeral Token Storage:** Stores session token in memory / `sessionStorage` (zero plaintext disk exposure).
- [ ] **Uniform Error Handling:** Graceful UI alerts for `ERR_INVALID_CREDENTIALS` (anti-enumeration privacy).
- [ ] **Sign Out:** Implements `POST /api/v1/auth/logout`, purges client storage, and resets view state.

### Phase 3: Employee Session Telemetry & Self-Revocation
- [ ] **User Profile Card:** Queries `GET /api/v1/me` and renders employee credentials (email, role, created timestamp).
- [ ] **Live Active Sessions Table:** Queries `GET /api/v1/me/sessions`, displaying device user-agents, IP addresses, login timestamps, and "Current Device" indicators.
- [ ] **1-Click Self-Revocation:** Wire "Revoke" button to `DELETE /api/v1/sessions/{session_id}`.
- [ ] **Automatic 401 Interceptor:** If the current session is revoked elsewhere, any API call receiving 401 immediately redirects to login.

### Phase 4: Enterprise Admin Security Console
- [ ] **Role Guarded Navigation:** Evaluates user role; displays "Admin Console" navigation tab exclusively for `role === 'admin'`.
- [ ] **System-Wide Sessions Directory:** Connects to `GET /api/v1/admin/sessions` with 1-click global revocation kill-switch.
- [ ] **User Account Control:** Interfaces with `GET /api/v1/admin/users`, supporting 1-click account unlock (`POST /api/v1/admin/users/{id}/unlock`) and status toggling (`ACTIVE`, `LOCKED`, `DISABLED`).
- [ ] **Immutable Security Audit Log Explorer:** Implements `GET /api/v1/admin/audit-logs` with event-type filtering and XSS-sanitized tabular output.

### Phase 5: OIDC Identity Demo, Stretch Goals & Deployment
- [ ] **WebAuthn / FIDO2 Concept Card:** Interactive modal demonstrating biometric authentication standards.
- [ ] **Render Cold-Start Toast:** UX helper displaying a graceful *"Waking up container..."* alert when backend response latency exceeds 2.0s.
- [ ] **Production Deployment:** Host static build on Vercel with strict Content Security Policy (`vercel.json`).

---

## 3. Component Architecture & File Structure

```text
vaultauth-frontend/
├── index.html                  # Semantic layout with responsive auth & dashboard containers
├── vercel.json                 # Security response headers (CSP, X-Frame-Options, SRI)
├── css/
│   └── style.css               # Cybersecurity dark theme, glowing badges, card layouts
├── js/
│   ├── config.js               # API URL endpoint configuration
│   ├── api.js                  # Asynchronous HTTP client & error handler
│   └── app.js                  # Application entrypoint & DOM event orchestration
└── docs/
    ├── PRD_v2.0.md             # Complete technical requirements specification
    ├── FRONTEND_PLANNER.md     # This implementation roadmap
    └── VaultAuth_SSO_PRD_v2.0.pdf
```

---

## 4. API Integration Contract Mapping

| Frontend Feature | Target Backend Endpoint | Method | Expected HTTP Response |
| :--- | :--- | :---: | :---: |
| **System Health Check** | `/health` | `GET` | `200 {"status": "ok"}` |
| **User Registration** | `/api/v1/auth/register` | `POST` | `201 {"message": "User registered successfully."}` |
| **User Login** | `/api/v1/auth/login` | `POST` | `200 {"token": "...", "user_id": "...", "role": "..."}` |
| **Logout** | `/api/v1/auth/logout` | `POST` | `204 No Content` |
| **Profile Retrieval** | `/api/v1/me` | `GET` | `200 UserProfile` |
| **Active Sessions** | `/api/v1/me/sessions` | `GET` | `200 SessionListResponse` |
| **Revoke Session** | `/api/v1/sessions/{id}` | `DELETE` | `200 SessionRevokeResponse` |
| **Admin All Sessions** | `/api/v1/admin/sessions` | `GET` | `200 AdminSessionListResponse` |
| **Admin Audit Trail** | `/api/v1/admin/audit-logs` | `GET` | `200 AdminAuditLogListResponse` |
| **Admin User Unlock** | `/api/v1/admin/users/{id}/unlock` | `POST` | `200 AdminActionResponse` |
