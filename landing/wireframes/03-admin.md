# Wireframes — Admin Tabs

Covers the four admin-only routes under `DashboardShell` + `RequireAdmin`:
`/dashboard/admin/apps`, `/users`, `/audit-logs`, `/sessions`. Sources:
`src/pages/dashboard/admin/*.tsx`. All inherit the dashboard shell from
`02-dashboard.md` (TopBar + sub-nav with admin divider + footer).

---

## 1. `/dashboard/admin/apps` — OAuth 2.0 / OIDC Applications

**Source:** `src/pages/dashboard/admin/AppsTab.tsx`
**Purpose:** register and revoke OAuth/OIDC relying-party clients. On mount:
`api.getOAuthClients()`.

### Section inventory (in order)

1. **Page header** — H1 **"OAuth 2.0 / OIDC Applications"**; subtitle "Registered
   Single Sign-On relying parties, public SPAs, and confidential server clients.";
   right actions: outline **"Refresh"** and amber **"Register Application"** (Plus).
2. **Notifications** (conditional): dismissible success banner `Application "<name>"
   registered successfully.` / `Application "<name>" revoked.`; dismissible error banner.
3. **Filter & search toolbar**:
   - Search input with icon, placeholder "Search applications, client IDs, or
     URIs…" (clear `X` when typed).
   - "Type:" select — All Types / Confidential / Public (SPA).
   - Badge: "N Client(s)".
4. **Applications table card** — `table-fixed`, columns:

   | Column | Width | Content |
   |--------|-------|---------|
   | Application / Client ID | 28% | Name (semibold, truncated) + mono `ID: <client_id>` + CopyButton |
   | Client Type | 13% | Badge: `confidential` (Lock icon, default) / `public` (Globe, secondary), uppercase |
   | Redirect URIs | 24% | Primary URI (mono) + CopyButton + `+N` badge with tooltip listing all URIs; or "None configured" |
   | Allowed Scopes | 14% | Mono comma-joined list, truncated with title tooltip; defaults to `openid` |
   | Created | 11% | `formatRelativeTime`, tooltip shows full `formatDateTime` |
   | Action | 10% (right) | Destructive **"Revoke"** (Trash2) |

   Empty states: loading "Loading registered applications…"; filtered
   "No applications match the current filter."; otherwise "No OAuth applications found."

5. **Register Application modal** (`Dialog`, `sm:max-w-md`), two modes:
   - **Form mode** — header icon `KeyRound`, title **"Register New Application"**,
     description "Configure an OAuth 2.0 / OpenID Connect relying party client.";
     conditional error Alert; fields:
     - "Application Name" input, placeholder "e.g. Internal Payroll Portal"
     - "Client Profile Type" select — "Confidential (Backend Service / Secure
       Server)" / "Public (SPA Web Client / Mobile Native App)"
     - "Allowed Redirect URIs" textarea (2 rows), placeholder
       "https://app.company.com/oauth/callback", hint "Comma or newline separated"
       (default value `https://myapp.internal/callback`)
     - "Authorized Scopes" checkboxes: `openid`, `email`, `profile` (all checked by default)
     - Footer: outline **"Cancel"** + amber **"Create Client"** (loading "Minting Credentials…")
   - **One-time secret view** (after create) — header icon `ShieldCheck`,
     title **"Credentials Generated"**, description "Save these credentials now.
     The client secret will never be displayed again."; destructive Alert
     "Important Security Notice" — "The client_secret cannot be recovered after
     this dialog closes."; mono rows "Client ID" + CopyButton and "Client Secret
     (One-Time Display)" + CopyButton; checkbox "I have securely saved the client
     secret"; footer **"Done & Close"** (disabled until checked).
6. **Revoke confirmation modal** — destructive icon `AlertTriangle`, title
   **"Revoke Application Access"** (destructive), description "Are you sure you
   want to deactivate and revoke "<name>"? All live tokens and SSO login requests
   for this client ID will fail immediately."; footer outline "Cancel" +
   destructive **"Confirm Revocation"**.

### ASCII wireframe (main tab)

```
+ DashboardShell ----------------------------------------------------------------+
| OAuth 2.0 / OIDC Applications                 [Refresh] [+ Register Application]|
| Registered SSO relying parties, public SPAs, and confidential server clients.   |
+--------------------------------------------------------------------------------+
| {green: ✓ Application "Payroll" registered successfully.                    [x]} |
+--------------------------------------------------------------------------------+
| [search] Search applications, client IDs, or URIs…    Type: [All Types v]  [2 Clients]|
+--------------------------------------------------------------------------------+
| +----------------------------------------------------------------------------+ |
| | APPLICATION / CLIENT ID   | TYPE         | REDIRECT URIS    | SCOPES | CREATED| ACTION| |
| |---------------------------+--------------+------------------+--------+-------+-------| |
| | Internal Payroll Portal   | (lock)       | https://payroll… | openid,| 2d ago| [Revoke]|
| | ID: cli_8f2a…    [copy]    | CONFIDENTIAL | /callback [copy] | email, |       |       | |
| |                           |              | +2 (tooltip)     | profile|       |       | |
| |---------------------------+--------------+------------------+--------+-------+-------| |
| | Analytics Dashboard       | (globe)      | http://localhost | openid | 5h ago| [Revoke]|
| | ID: cli_1b9c…    [copy]    | PUBLIC       | :5173/cb [copy]  | email  |       |       | |
| +----------------------------------------------------------------------------+ |
| :: empty: "No applications match the current filter." / "No OAuth applications found."|
+--------------------------------------------------------------------------------+
```

### ASCII wireframe (create modal — one-time-secret state)

```
            +--------------------------------------------------+
            | [shield] Credentials Generated                   |
            |          Save these credentials now. The secret  |
            |          will never be displayed again.          |
            |  (!) IMPORTANT SECURITY NOTICE                   |
            |      client_secret cannot be recovered after …   |
            |  Client ID                                       |
            |  [ cli_8f2a...                          ] [copy] |
            |  Client Secret (One-Time Display)                |
            |  [ *********************************    ] [copy] |
            |  [ ] I have securely saved the client secret     |
            |  [>>>>>>>>>> Done & Close <<<<<<<<<<<<<<<<<]     |  <- disabled until checked
            +--------------------------------------------------+
```

**After:** keep the two modal states exactly (the one-time secret gate is a real
security behavior); raise table text to 13px and give the name column more room;
replace `+N` tooltip with an "N URIs" disclosure that expands inline; scope values
become small neutral chips instead of mono comma text.

---

## 2. `/dashboard/admin/users` — User Governance & Access Control

**Source:** `src/pages/dashboard/admin/UsersTab.tsx`
**Purpose:** administer corporate accounts and inspect/revoke their sessions.
On mount (200ms debounce): `api.getAdminUsers` + `api.getGlobalSessions`.

### Section inventory (in order)

1. **Page header** — H1 **"User Governance & Access Control"**; subtitle "Administer
   enterprise corporate accounts grouped by User ID and email with live session
   inspection."; outline **"Refresh"**.
2. **Notifications** (conditional): success (green) / error (red) banners.
3. **Filters toolbar**:
   - Search input: "Search by corporate email or user ID…"
   - Sort button: "Alphabetical (A–Z)" (ArrowDownAZ) / "Alphabetical (Z–A)" (ArrowUpAZ).
   - "Role:" select — All Roles / User / Admin.
   - "Status:" select — All Statuses / ACTIVE / LOCKED / DISABLED.
4. **Employee Directory card** — header with `Users` icon tile, H2 **"Employee
   Directory"**, subtitle "Grouped by Corporate Email & User ID • Sorted
   alphabetically (A–Z)." and badge "N Accounts".
5. **Table** columns:

   | Column | Content |
   |--------|---------|
   | Corporate Email / User ID | Email (mono semibold) + optional "You" badge for current admin + mono `ID: <id>` + CopyButton |
   | Role | Badge: `admin` (default) / `user` (secondary), uppercase |
   | Account Status | Badge: ACTIVE (success) / LOCKED (warning) / DISABLED (destructive) |
   | Active Sessions | "No active sessions" (italic) OR dropdown trigger showing dot + "N Session(s)" + chevron (multiple = amber pulse dot) |
   | Failed Strikes | `{n} / 3`; bold destructive when locked/≥3, amber when >0 |
   | Registered | `formatDateTime(created_at)` |
   | Manage | Ghost `MoreHorizontal` icon button |

6. **Active Sessions dropdown** (opens from column 4) — `DropdownMenuContent` w-80:
   - Header: "Active User Sessions (N)" + optional "Multiple Devices" badge.
   - Scrollable list per session: device icon + parsed device name + destructive
     **"Revoke"** (small) + mono IP + relative last active.
7. **Manage dropdown** (opens from column 7) — w-56, label "Account Controls":
   - "Unlock Account (Reset Strikes)" (Unlock, amber; disabled unless locked/≥3).
   - "Disable User" (UserX, destructive) / "Enable User" (UserCheck, green;
     disabled for current user).
   - Separator.
   - "Promote to Admin" / "Demote to User" (Shield; disabled for current user or
     non-ACTIVE, with sub-label "Requires ACTIVE status").

### Interactions (grounded in source)
- Toggle status: optimistic update + disabled-account cache sync; self-disable
  blocked with error "You cannot disable your own active administrative account."
- Role change: only ACTIVE accounts; self-change blocked "You cannot alter your own
  administrative authority."
- Unlock resets the 3-strike counter; messages shown in success banner.

### ASCII wireframe

```
+ DashboardShell ----------------------------------------------------------------+
| User Governance & Access Control                          [Refresh]             |
| Administer enterprise corporate accounts grouped by User ID and email …         |
+--------------------------------------------------------------------------------+
| {green: ✓ User account jane@corp.com disabled successfully. All sessions …}     |
+--------------------------------------------------------------------------------+
| [search] Search by corporate email or user ID…  [A–Z v] Role: [All v] Status: [All v]|
+--------------------------------------------------------------------------------+
| +----------------------------------------------------------------------------+ |
| | [users] Employee Directory                              [128 Accounts]      | |
| | Grouped by Corporate Email & User ID • Sorted alphabetically (A–Z).        | |
| +----------------------------------------------------------------------------+ |
| | CORPORATE EMAIL / ID | ROLE  | STATUS   | ACTIVE SESSIONS | STRIKES| REGISTERED|MNGE|
| |----------------------+-------+----------+-----------------+--------+-----------+----| |
| | admin@corp.com (You) | ADMIN | ACTIVE   | (●) 1 Session v | 0 / 3  | Nov 23…   |[…] |
| | ID: usr_admin… [copy] |       |          |                 |        |           |    |
| |----------------------+-------+----------+-----------------+--------+-----------+----| |
| | jane@corp.com        | USER  | LOCKED   | (pulse) 2 Ses. v| 3 / 3  | Nov 20…   |[…] |
| | ID: usr_mfa… [copy]   |       |          |  -> dropdown    |        |           |    |
| |----------------------+-------+----------+-----------------+--------+-----------+----| |
| | sam@corp.com         | USER  | DISABLED | No active ses.  | 0 / 3  | Nov 18…   |[…] |
| +----------------------------------------------------------------------------+ |
|   Sessions dropdown: "Active User Sessions (2) [Multiple Devices]"              |
|    [lap] Chrome on macOS  [Revoke]   globe 10.0.0.5 · 2m ago                     |
|   Manage dropdown: Account Controls / Unlock / Disable|Enable / Promote|Demote   |
+--------------------------------------------------------------------------------+
```

**After:** keep the dropdown-driven interaction model (it is the only per-user
control surface); increase email/ID cell to 14px/12px and drop mono for email;
status badges become dot + title-case label; add a confirm step for
Disable/Promote in the redesign; keep "You" badge to prevent self-actions.

---

## 3. `/dashboard/admin/audit-logs` — Security Audit Trail

**Source:** `src/pages/dashboard/admin/AuditLogsTab.tsx`
**Purpose:** view/filter an immutable audit trail with expandable JSON payloads.
On mount: `api.getAuditLogs` + `api.getAdminUsers` (for ID→email resolution).

### Section inventory (in order)

1. **Page header** — H1 **"Security Audit Trail"**; subtitle "Immutable system
   audit logs recording authentication events, administrative actions, and
   authorization grants."; outline **"Refresh"**.
2. **Error banner** (conditional).
3. **Filter toolbar** — two selects:
   - "Event Type:" with options: `All`, `LOGIN_SUCCESS`, `LOGIN_FAILED`, `LOGOUT`,
     `MFA_CHALLENGE_ISSUED`, `MFA_VERIFIED`, `SESSION_REVOKED`,
     `OAUTH_CLIENT_CREATED`, `OAUTH_CLIENT_REVOKED`, `OAUTH_TOKEN_ISSUED`,
     `USER_UNLOCKED`, `USER_STATUS_CHANGED`, `ROLE_CHANGED`.
   - "Fetch Limit:" `25 Entries` / `50 Entries` (default) / `100 Entries`.
4. **Activity Records card** — header with `FileText` icon tile, H2 **"Activity
   Records"**, subtitle "Timestamped security operations with IP attribution and
   telemetry details."; badge "N Recorded".
5. **Table** columns:
   - (chevron expander column, w-10)
   - **Timestamp** (w-180) — `formatDateTime(ts)`
   - **Event Action** — Badge colored by rule: FAIL/REVOKED → destructive;
     SUCCESS/UNLOCKED → success; ROLE/STATUS → warning; else secondary.
   - **Principal User** — actor email (or ID) + CopyButton; ID row; optional
     "Target:" block when a distinct target user exists; "Anonymous / System"
     when none.
   - **Client IP Address** — Globe icon + mono IP (strips `/32`).
6. **Expanded row** (`colSpan=5`) — panel "Audit Payload & Event Metadata" with
   "Log ID: N", CopyButton (copies full log JSON), and a `<pre>` of
   `JSON.stringify(details || log, null, 2)`.

### ASCII wireframe

```
+ DashboardShell ----------------------------------------------------------------+
| Security Audit Trail                                        [Refresh]           |
| Immutable system audit logs recording authentication events, admin actions …    |
+--------------------------------------------------------------------------------+
| Event Type: [All v]                       Fetch Limit: [50 Entries v]           |
+--------------------------------------------------------------------------------+
| +----------------------------------------------------------------------------+ |
| | [file] Activity Records                                     [N Recorded]     | |
| | Timestamped security operations with IP attribution and telemetry details. | |
| +----------------------------------------------------------------------------+ |
| |   | TIMESTAMP           | EVENT ACTION      | PRINCIPAL USER    | CLIENT IP | |
| |---+---------------------+-------------------+-------------------+-----------| |
| | > | Nov 23, 10:42:00    | LOGIN_SUCCESS     | jane@corp.com     | 10.0.0.5  | |
| |   |                     | (success)         | ID: usr_mfa…      |           | |
| | > | Nov 23, 10:40:12    | LOGIN_FAILED      | unknown@corp.com  | 10.0.0.9  | |
| |   |                     | (destructive)     |                   |           | |
| | > | Nov 23, 09:15:33    | ROLE_CHANGED      | admin@corp.com    | 10.0.0.2  | |
| |   |                     | (warning)         | Target: sam@corp… |           | |
| |   |                     |                   | ID: usr_sam…      |           | |
| | > | Nov 23, 08:02:01    | SESSION_REVOKED   | Anonymous / System| —         | |
| +----------------------------------------------------------------------------+ |
|   Expanded (v): "Audit Payload & Event Metadata"   Log ID: 42      [copy JSON]   |
|   +------------------------------------------------------------------------+  |
|   | {                                                                      |  |
|   |   "event": "ROLE_CHANGED", "actor_user_id": "usr_admin…",              |  |
|   |   "target_user_id": "usr_sam…", ...                                     |  |
|   | }                                                                      |  |
|   +------------------------------------------------------------------------+  |
+--------------------------------------------------------------------------------+
```

**After:** give timestamp 13px mono and events title-case chips (e.g. "Login failed")
while keeping the raw event name in a tooltip; expander panel uses a code-surface
`#F1F3F6` with 12px mono; keep color semantics of the badge rule.

---

## 4. `/dashboard/admin/sessions` — Global Active Sessions

**Source:** `src/pages/dashboard/admin/GlobalSessionsTab.tsx`
**Purpose:** directory-wide live session inventory, grouped by user, with single
and bulk revocation. On mount: `api.getGlobalSessions(100)` + `api.getAdminUsers`.

### Section inventory (in order)

1. **Page header** — H1 **"Global Active Sessions"**; subtitle "Directory-wide live
   authentication grants, client footprints, and instant remote revocation.";
   right actions: ghost **"Expand All"** / "Collapse All" (only when groups exist)
   and outline **"Refresh"**.
2. **Notifications** (conditional): success "Session terminated. Security token
   expunged immediately from directory." / "Terminated all N active session(s) for
   user."; error banner.
3. **Filter & counter bar** — search input "Search by User ID, email, IP, or
   browser…"; badge "N User(s)" (primary tint) and badge "N Live Session(s)".
4. **Grouped user cards** (`space-y-2.5`) — one card per user, each with:
   - **Collapsible header** (click anywhere): chevron, `User` icon tile, email
     (or user ID) + CopyButton, badge "N Session(s)" (primary tint when multiple),
     second line "ID: <user_id>"; right side telemetry (hidden < md) — Globe + IP
     + "•" + relative last active — and, **only when >1 session**, destructive
     **"Terminate All (N)"** (Trash2).
   - **Expanded table** (`min-w-[720px]`, scrollable) columns:

     | Column | Content |
     |--------|---------|
     | Browser | device icon + parsed browser name (tooltip: raw UA) + optional "Current" badge |
     | IP Address | Globe + mono IP |
     | Last Active | relative time |
     | Signed In | `formatDateTime(created_at)` or "—" |
     | Expires | `formatDateTime(expires_at)` or "Active" |
     | Action (right) | destructive **"Terminate"** / "…" while revoking |

5. **Loading state** — card with spinner + "Querying active sessions across
   enterprise directory…".
6. **Empty state** — `ShieldAlert` icon + "No active sessions found across
   enterprise directory." (or "No sessions match filter criteria.") + "Only
   active and valid sessions appear here."

### ASCII wireframe

```
+ DashboardShell ----------------------------------------------------------------+
| Global Active Sessions                     [Expand All] [Refresh]               |
| Directory-wide live authentication grants, client footprints, instant revocation|
+--------------------------------------------------------------------------------+
| {green: ✓ Terminated all 2 active session(s) for user.}                         |
+--------------------------------------------------------------------------------+
| [search] Search by User ID, email, IP, or browser…    [3 Users] [7 Live Sessions]|
+--------------------------------------------------------------------------------+
| v [user] jane@corp.com [copy] [2 Sessions]   globe 10.0.0.5 • 2m ago  [Terminate All (2)]|
|   ID: usr_mfa…                                                                  |
|   +--------------------------------------------------------------------------+ |
|   | BROWSER         | IP ADDRESS | LAST ACTIVE | SIGNED IN   | EXPIRES    |ACTION| |
|   |-----------------+------------+-------------+-------------+------------+------| |
|   | [lap] Chrome    | 10.0.0.5   | 2m ago      | Nov 23,…    | Nov 24,…   |[Term.]| |
|   | (Current)       |            |             |             |            |      | |
|   | [mob] Safari    | 10.0.1.2   | 1h ago      | Nov 23,…    | Nov 24,…   |[Term.]| |
|   +--------------------------------------------------------------------------+ |
| > [user] sam@corp.com [copy] [1 Session]     globe 10.0.0.9 • 1h ago             |
| > [user] root@corp.com [copy] [4 Sessions]   globe 10.0.0.2 • 5m ago  [Terminate All (4)]|
+--------------------------------------------------------------------------------+
| :: empty: [shield-alert] No active sessions found across enterprise directory.  |
+--------------------------------------------------------------------------------+
```

**After:** keep grouped-card pattern; flatten cards to surface + 1px border (no
glow); use 14px email and 12px ID; "Terminate All" requires a confirmation modal
(new rule for destructive bulk actions); show expires as 12px muted and keep
"Active" in success green.

---

## Admin cross-page notes

- All admin pages use the same `card` shell: `rounded-xl border-border/80 bg-card`
  with a radial amber wash; tables are the densest content in the app.
- `CopyButton` is used for client IDs, user IDs, redirect URIs and actor IDs — keep
  a single icon-only style with tooltip.
- Only `AppsTab` uses a `Dialog` for create/revoke; `UsersTab` and
  `GlobalSessionsTab` act immediately via dropdowns/buttons. The redesign proposal
  adds confirmation to the latter two for destructive safety, but this is a
  **proposal**, not existing behavior.
- Relative time (`formatRelativeTime`) and absolute time (`formatDateTime`) are
  used together across tables — preserve both.
