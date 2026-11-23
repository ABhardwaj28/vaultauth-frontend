# Wireframes — Error & System Pages

Covers `403`, `404`, `429`, `500`, service unavailable, policy unavailable
(`/privacy`, `/terms`), plus the global `ErrorBoundary` crash variant. Sources:
`src/components/layout/ErrorLayout.tsx`, `src/pages/errors/*`, and the global
branch in `src/App.tsx`. See `00-overview.md` for notation and design direction.

---

## Shared ErrorLayout frame

**Source:** `src/components/layout/ErrorLayout.tsx`
**Props:** `status`, `code`, `title`, `description`, `requestId?`, `timestamp?`,
`primaryAction` (default "Return to Dashboard" → `/dashboard`), `secondaryAction?`,
`extraContent?`.

Block order (top → bottom):
1. Ambient background — same blurred amber wash as AuthShell.
2. `<TopBar>` — sticky brand/session bar (note: no auth context needed; `TopBar`
   shows brand + theme toggle + Sign Out only if `user`).
3. Centered card (`max-w-md`, `rounded-xl border bg-card p-6/7`, `space-y-5`):
   - **Row 1**: left `<Badge variant="destructive">` showing `{status} • {code}`
     (mono); right 40×40 destructive-tinted tile with `AlertTriangle`.
   - **H1** `{title}` (`text-xl font-bold`).
   - **Description** (`text-xs text-muted-foreground`).
   - `extraContent` (optional, e.g. countdown).
   - **Collapsible "Technical Diagnostics"** (`bg-muted/20 border rounded-lg p-3`):
     - Trigger: chevron + "Technical Diagnostics" + right "Inspect"/"Hide".
     - Expanded rows (mono 11px): "Status Code:", "Error Code:", "Request ID:"
       (if provided), "Timestamp:" (defaults to `new Date().toISOString()`).
   - **Actions**: primary full-width button (`h-10 font-semibold`) + optional
     secondary full-width outline button (`h-9 text-xs`).
4. Footer — same legal/trust footer as AuthShell ("© 2026 VaultAuth SSO …",
   "Privacy Policy • Terms of Service • Zero-Trust Architecture").

```
+------------------------------------------------------------------------------+
| AMBIENT WASH (blurred blob + radial)                                          |
+------------------------------------------------------------------------------+
| [shield] VaultAuth SSO                                    [theme] [Sign Out]    |  <- TopBar
+------------------------------------------------------------------------------+
|                  +--------------------------------------+                     |
|                  | [403 • ERR_FORBIDDEN]    (!tile)     |                     |
|                  |                                      |                     |
|                  | <Title>                              |                     |
|                  | <description>                        |                     |
|                  |                                      |                     |
|                  | {extraContent — e.g. countdown}      |                     |
|                  |                                      |                     |
|                  | +----------------------------------+  |                     |
|                  | | > Technical Diagnostics   Inspect |  |                     |
|                  | +----------------------------------+  |                     |
|                  |   (expanded) Status Code: 403         |                     |
|                  |              Error Code: …            |                     |
|                  |              Request ID: …            |                     |
|                  |              Timestamp: …             |                     |
|                  |                                      |                     |
|                  | [>>>>>>>> primary action <<<<<<<<<]   |                     |
|                  | [    secondary action (outline)     ] |                     |
|                  +--------------------------------------+                     |
+------------------------------------------------------------------------------+
| © 2026 VaultAuth SSO … • Privacy Policy • Terms • Zero-Trust                   |
+------------------------------------------------------------------------------+
```

**After:** remove ambient wash; card max-width 440px, flat surface, 24px padding;
replace the destructive badge + triangle with a single status chip + a calm
explanatory icon (amber for 403/429, red for 5xx, slate for 404); "Technical
Diagnostics" collapses by default and uses 12px mono on a `#F1F3F6` panel.

---

## 1. `403` — Access Denied

**Source:** `ForbiddenPage.tsx`. Triggered by `RequireAdmin` for non-admin users.
- Badge: `403 • ERR_FORBIDDEN`
- Title: **"Access Denied"**
- Description: "Administrator privileges are required to view this section. Your
  current session does not hold the necessary authority."
- Primary: **"Return to My Profile"** → `/dashboard/profile`
- Secondary: **"Sign In as Admin"** → `/login`
- No extraContent, no requestId.

```
+--------------------------------------+
| [403 • ERR_FORBIDDEN]      (!)       |
|                                      |
| Access Denied                        |
| Administrator privileges are required|
| to view this section. Your current   |
| session does not hold the necessary  |
| authority.                           |
|                                      |
| > Technical Diagnostics      Inspect |
|                                      |
| [>> Return to My Profile <<<<]        |  -> /dashboard/profile
| [   Sign In as Admin            ]    |  -> /login
+--------------------------------------+
```

---

## 2. `404` — Page Not Found (catch-all `*`)

**Source:** `NotFoundPage.tsx`. Also the catch-all for any unknown route.
- Badge: `404 • ERR_NOT_FOUND`
- Title: **"Page Not Found"**
- Description: "The requested identity resource or dashboard endpoint does not
  exist or has been relocated."
- Primary action depends on `isAuthenticated`:
  - Authenticated: "Back to Dashboard" → `/dashboard`
  - Anonymous: "Return to Sign In" → `/login`
- No secondary action.

```
+--------------------------------------+
| [404 • ERR_NOT_FOUND]      (!)       |
|                                      |
| Page Not Found                       |
| The requested identity resource or   |
| dashboard endpoint does not exist or |
| has been relocated.                  |
|                                      |
| > Technical Diagnostics      Inspect |
|                                      |
| [>> Back to Dashboard <<<<]           |  authenticated
|   (or "Return to Sign In" if anon)    |
+--------------------------------------+
```

---

## 3. `429` — Request Limit Exceeded

**Source:** `RateLimitedPage.tsx`. Reads `?reset=<unix seconds>`; default 60s.
- Badge: `429 • ERR_RATE_LIMITED`
- Title: **"Request Limit Exceeded"**
- Description: "Too many requests were dispatched in a short window. To protect
  the cryptographic engine and database pool, an atomic cooldown has been triggered."
- **extraContent**: centered bordered panel with Clock icon and mono text
  "Retry permitted in Ns" — or green "Cooldown elapsed. Ready to retry."
- Primary: while counting down `Wait (Ns)`; at 0 `Retry Request`; onClick = `navigate(-1)`.
- Secondary: "Return to Sign In" → `/login`.
- Timer ticks every second; at 0 the primary button unlocks.

```
+--------------------------------------+
| [429 • ERR_RATE_LIMITED]   (!)       |
|                                      |
| Request Limit Exceeded               |
| Too many requests were dispatched in |
| a short window. To protect the       |
| cryptographic engine and database    |
| pool, an atomic cooldown has been …  |
|                                      |
| +----------------------------------+ |
| |  (clock)  Retry permitted in 42s | |  <- live countdown
| +----------------------------------+ |
|                                      |
| > Technical Diagnostics      Inspect |
|                                      |
| [>>>>> Wait (42s) <<<<<<<<<<<<<]      |  -> "Retry Request" at 0
| [   Return to Sign In            ]   |
+--------------------------------------+
```

---

## 4. `500` — Service Unavailable (server)

**Source:** `ServerErrorPage.tsx`. Note the title is "Service Unavailable" even
though status is 500. Query params: `?code`, `?message`, `?req_id`.
- Badge: `500 • {code}` where code defaults to `ERR_INTERNAL_SERVER`.
- Title: **"Service Unavailable"**
- Description: `?message` or "The authentication gateway encountered an
  unexpected internal exception or the backend service is currently unreachable."
- `requestId` from `?req_id` → appears in diagnostics.
- Primary: **"Retry Connection"** (onClick `window.location.reload()`).
- Secondary: **"Back to Home"** → `/`.

```
+--------------------------------------+
| [500 • ERR_INTERNAL_SERVER]  (!)     |
|                                      |
| Service Unavailable                  |
| The authentication gateway encountered|
| an unexpected internal exception or  |
| the backend service is currently …   |
|                                      |
| > Technical Diagnostics      Inspect |
|   Status Code: 500                   |
|   Error Code: ERR_INTERNAL_SERVER    |
|   Request ID: <req_id if provided>   |
|   Timestamp: <ISO>                   |
|                                      |
| [>>>>>> Retry Connection <<<<<<<]     |  -> reload()
| [        Back to Home              ] |
+--------------------------------------+
```

---

## 5. Service Unavailable (gateway offline — HTTP 503)

**Source:** `ServiceUnavailablePage.tsx`. **Standalone screen** (not ErrorLayout):
rendered by `AppRoutes` in place of *all* routes when
`AuthContext.isServiceUnavailable` is true (failed health probe during init or retry).
It uses destructive ambient wash and a centered card, but **no TopBar**.

- Icon tile: `ServerOff` (destructive).
- H1: **"Service Unavailable"**
- Subtitle: "VaultAuth identity and session gateway is currently unreachable."
- Body: "The authentication gateway could not establish a connection to the
  backend server. The service may be offline, undergoing cold-start wake up, or
  your network connection might be interrupted."
- Status well (mono, `bg-muted/30`):
  - `Status: HTTP 503 / Offline` (destructive)
  - `Endpoint: <VITE_API_BASE_URL || https://api.vaultauth.proplays2312.eu.org>`
- Button: **"Auto-reconnecting in Ns (or Retry Now)"** → `onRetry` (calls
  `checkServiceAvailability()`); while retrying, spinner +
  "Connecting to gateway…" and timer paused.
- Auto-retry every 5 seconds; countdown resets to 5.
- Legal footer (same links as AuthShell).

```
+------------------------------------------------------------------------------+
| AMBIENT WASH (destructive-tinted)                                             |
+------------------------------------------------------------------------------+
|               +--------------------------------------+                       |
|               |          [server-off tile]           |                       |
|               |        Service Unavailable           |                       |
|               | VaultAuth identity and session       |                       |
|               | gateway is currently unreachable.    |                       |
|               |                                      |                       |
|               | The authentication gateway could not  |                       |
|               | establish a connection to the backend|                       |
|               | server. The service may be offline,  |                       |
|               | undergoing cold-start wake up…       |                       |
|               |                                      |                       |
|               | +----------------------------------+  |                       |
|               | | Status: HTTP 503 / Offline       |  |                       |
|               | | Endpoint: https://api.vaultauth… |  |                       |
|               | +----------------------------------+  |                       |
|               |                                      |                       |
|               | [>> Auto-reconnecting in 5s (or      |                       |
|               |        Retry Now) <<<<<<<<<<<<<<<<]   |                       |
|               +--------------------------------------+                       |
+------------------------------------------------------------------------------+
| © 2026 … • Privacy Policy • Terms of Service • Zero-Trust                     |
+------------------------------------------------------------------------------+
```

---

## 6. Policy Unavailable (`/privacy`, `/terms` — HTTP 503)

**Source:** `PolicyUnavailablePage.tsx`. Detects path (`privacy` → "Privacy
Policy", otherwise "Terms of Service").
- Badge: `503 • ERR_DOCUMENT_UNAVAILABLE`
- Title: **"<Privacy Policy|Terms of Service> Unavailable"**
- Description: "The <doc> is currently undergoing compliance review and is
  temporarily unavailable. Please check back later or contact your organization's
  legal administrator."
- Primary: authenticated → "Back to Dashboard" (`/dashboard`); anonymous →
  "Return to Sign In" (`/login`).
- No secondary action.

```
+--------------------------------------+
| [503 • ERR_DOCUMENT_UNAVAILABLE] (!) |
|                                      |
| Privacy Policy Unavailable           |
| (or "Terms of Service Unavailable")  |
| The Privacy Policy is currently      |
| undergoing compliance review and is  |
| temporarily unavailable. Please check|
| back later or contact your org's …   |
|                                      |
| > Technical Diagnostics      Inspect |
|                                      |
| [>> Back to Dashboard <<<<<<]         |  authenticated
|   (or "Return to Sign In" if anon)    |
+--------------------------------------+
```

---

## 7. (Bonus) Global crash — `ErrorBoundary`

**Source:** `src/pages/errors/ErrorBoundary.tsx`. Catches any unhandled render
exception anywhere in the app and renders ErrorLayout:
- Badge: `500 • ERR_CLIENT_CRASH`
- Title: **"Unexpected Application Error"**
- Description: `error.message` or "A client-side runtime exception occurred. The
  state has been captured safely."
- Primary: **"Reload Application"** (window.location.reload).
- Secondary: **"Return to Home"** → `/`.

Not a distinct route, but worth including in an error-state inventory because it
uses the same shell.

---

## Error-state inventory summary

| Status | Route | Code | Title | Primary action | Secondary |
|--------|-------|------|-------|----------------|-----------|
| 403 | `/403` | `ERR_FORBIDDEN` | Access Denied | Return to My Profile | Sign In as Admin |
| 404 | `*` | `ERR_NOT_FOUND` | Page Not Found | Back to Dashboard / Return to Sign In | — |
| 429 | `/429` | `ERR_RATE_LIMITED` | Request Limit Exceeded | Wait (Ns) / Retry Request | Return to Sign In |
| 500 | `/500` | `ERR_INTERNAL_SERVER` (or `?code`) | Service Unavailable | Retry Connection | Back to Home |
| 503 | global (no route) | — | Service Unavailable | Auto-reconnect / Retry Now | — |
| 503 | `/privacy`, `/terms` | `ERR_DOCUMENT_UNAVAILABLE` | <Doc> Unavailable | Back to Dashboard / Return to Sign In | — |
| 500 | boundary | `ERR_CLIENT_CRASH` | Unexpected Application Error | Reload Application | Return to Home |
