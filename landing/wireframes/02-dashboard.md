# Wireframes — Dashboard Shell & User Tabs

Covers `DashboardShell` plus `/dashboard/profile`, `/dashboard/sessions`,
`/dashboard/settings`. Sources: `src/components/layout/DashboardShell.tsx`,
`TopBar.tsx`, `src/pages/dashboard/*.tsx`. Admin tabs are in `03-admin.md`.

---

## Dashboard Shell (all authenticated routes)

**Source:** `src/components/layout/DashboardShell.tsx`

Block order:
1. **`<TopBar>`** — sticky `top-0 z-40`, `h-14`, `border-b`, `bg-card/95 backdrop-blur`.
   - Left: logo link → `/dashboard` (ShieldCheck tile + "VaultAuth SSO"); then a
     hidden-on-mobile "Session Active • User Session|Admin Session" chip with a
     green 1.5px dot.
   - Right: user email (hidden < md, `max-w-[180px] truncate`, mono) + role badge
     (outline, uppercase, e.g. `ADMIN`) + `<ThemeToggle>` + outline **"Sign Out"**
     button (LogOut icon, hidden label < sm; hover → destructive).
2. **Sub-header nav** — `border-b`, `bg-card`, `max-w-7xl px-4/6`, horizontally
   scrollable. Nav items (icon + label, `text-xs`):
   - "My Profile" → `/dashboard/profile` (also active on `/dashboard`)
   - "Active Sessions" → `/dashboard/sessions`
   - "Account Settings" → `/dashboard/settings`
   - **Admin divider** — 1px line + "Admin" overline (hidden < sm), shown only
     when `isAdmin`:
     - "Application Management" → `/dashboard/admin/apps`
     - "User Management" → `/dashboard/admin/users`
     - "Security Audit Logs" → `/dashboard/admin/audit-logs`
     - "Global Sessions" → `/dashboard/admin/sessions`
   - Active state: `bg-primary/10 text-primary border border-primary/25 font-semibold`.
3. **Main** — `flex-1 max-w-7xl px-4/6 py-6 sm:py-8`, renders `<Outlet />`.
4. **Footer** — `border-t`, `bg-card`, `py-4`, `text-xs font-mono text-muted-foreground`:
   - "VaultAuth SSO | Enterprise Identity Gateway"
   - "Enterprise Identity Platform • Zero-Trust Architecture"

Background: page canvas + fixed radial amber wash at top (`primary/0.03`).

```
+------------------------------------------------------------------------------+
| [shield] VaultAuth SSO   [● Session Active • Admin Session]   user@co  ADMIN  |
|                                                        [theme] [Sign Out]     |  <- TopBar (sticky)
+------------------------------------------------------------------------------+
| (User) My Profile | Active Sessions | Account Settings | Admin | Application  |
|        Management | User Management | Security Audit Logs | Global Sessions   |  <- sub-nav (scrollable)
+------------------------------------------------------------------------------+
|                                                                              |
|  <page content — max-w-7xl>                                                  |
|                                                                              |
+------------------------------------------------------------------------------+
| VaultAuth SSO | Enterprise Identity Gateway                                  |
| Enterprise Identity Platform • Zero-Trust Architecture                        |  <- footer
+------------------------------------------------------------------------------+
```

**After:** keep TopBar sticky, height 64px; move theme toggle into an avatar menu
(email + role + theme + Sign Out) to reduce header clutter; sub-nav becomes a
single horizontal tab row with brand underline for active; page max-width 1200px,
24px gutters; remove radial background wash.

---

## 1. `/dashboard` (index) & `/dashboard/profile` — Profile & Identity

**Source:** `src/pages/dashboard/ProfileTab.tsx`
**Purpose:** inspect identity claims, RBAC authority and enforced MFA policy.
On mount: `api.getMe()` (button also refreshes).

### Section inventory (in order)

1. **Page header** — `pb-4 border-b`, flex column on mobile / row on desktop:
   - H1 **"Profile & Identity"**.
   - Subtitle: "Identity claims, role-based authorization governance, and
     multi-factor security credentials."
   - Right: outline **"Refresh Identity"** button (RefreshCw, spins while loading).
2. **Error banner** (if `error`): destructive tinted; default "Failed to load live
   profile telemetry."
3. **Identity cards grid** — `grid-cols-1 lg:grid-cols-3 gap-5`. Each card:
   `rounded-xl border bg-card p-5/6`, radial amber wash, 40×10 icon tile top-left,
   status badge top-right, overline + title, then a `border-t` detail section.

**Card 1 — Principal Identity** (icon `User`, badge `success` "Active" with green dot)
- Overline "Principal Identity"
- Title: user email (bold `text-lg`, truncated) or "—"
- Detail rows:
  - "Unique User ID" → mono id in a `bg-muted/40` well + `<CopyButton>`
  - "Directory Realm" → `corporate-sso`
  - "Member Since" → `formatDateTime(created_at)`
  - "Verification Status" → green check + "Email Verified"

**Card 2 — RBAC Authority** (icon `Shield`, badge = role uppercase: default amber
for admin, secondary for user)
- Overline "RBAC Authority"
- Title: "Enterprise Administrator" (admin) or "Standard Employee" (user)
- Detail rows:
  - "Clearance Level" → "Tier-1 Governance" / "Tier-2 Employee"
  - "Access Scope" → "Full System Control" / "Self-Service Workspace"
  - "Authorized Capabilities" → bulleted list (primary dot):
    - Admin: "User lifecycle governance (create, lock, promote)", "OAuth / OIDC
      application client registration", "System-wide audit logs & cross-tenant
      telemetry", "Global session termination & emergency revoking".
    - User: "Identity profile inspection & credential review", "Self active device
      & browser session management", "Enterprise Single Sign-On (SSO) authentication".

**Card 3 — MFA & Credentials** (icon `Key`, badge `warning` "Enforced")
- Overline "MFA & Credentials"
- Title "Multi-Factor Authentication (MFA)"
- Detail rows:
  - "Second Factor (MFA)" → "Email Challenge (OTP)"
  - "Code Expiration" → clock + "10 Minutes"
  - "Idle Session Timeout" → "30 Minutes"
  - "Absolute Session Cap" → "8 Hours"
  - "Lockout Threshold" → "3 Consecutive Strikes"

### ASCII wireframe

```
+ DashboardShell ----------------------------------------------------------------+
| Profile & Identity                                    [Refresh Identity]        |  <- header
| Identity claims, role-based authorization governance, and multi-factor security.  |
+--------------------------------------------------------------------------------+
| {red: (!) Failed to load live profile telemetry.}                               |  <- conditional
+--------------------------------------------------------------------------------+
| +---------------------------+ +---------------------------+ +----------------+ |
| | [user]         ( Active)  | | [shield]        ( ADMIN ) | | [key]  (ENFORCED)| |
| |                           | |                           | |                | |
| | PRINCIPAL IDENTITY        | | RBAC AUTHORITY            | | MFA & CREDENTIALS| |
| | name@company.com          | | Enterprise Administrator  | | Multi-Factor Auth | |
| | ------------------------- | | ------------------------- | | (MFA)          | |
| | Unique User ID            | | Clearance Level           | | -------------- | |
| | [usr_xxxxxxxxxxxx] [copy]  | | Tier-1 Governance         | | 2nd Factor:    | |
| | Directory Realm           | | Access Scope              | | Email OTP      | |
| | corporate-sso             | | Full System Control       | | Code Expiry:   | |
| | Member Since              | | Authorized Capabilities   | | 10 Minutes     | |
| | Nov 23, 2026, 10:42:00    | | • User lifecycle governance| | Idle Timeout:  | |
| | Verification Status       | | • OAuth/OIDC registration | | 30 Minutes     | |
| | ✓ Email Verified          | | • System-wide audit logs  | | Absolute Cap:  | |
| |                           | | • Global session revoking | | 8 Hours        | |
| +---------------------------+ | +---------------------------+ | Lockout:       | |
|                               |                               | 3 strikes      | |
|                               |                               | +--------------+ |
+--------------------------------------------------------------------------------+
```

**After:** three equal cards, flat surfaces, 24px padding; replace ALL-CAPS overlines
with 12px semibold title-case; keep one status badge per card; bullet list becomes
13px body with 8px gaps; copy button icon-only with tooltip.

---

## 2. `/dashboard/sessions` — Active Sessions

**Source:** `src/pages/dashboard/SessionsTab.tsx`
**Purpose:** list and revoke the current user's active sessions.
On mount: `api.getMySessions()`; filters to active, unrevoked, unexpired.

### Section inventory (in order)

1. **Page header** — H1 **"Active Sessions"**; subtitle "Workstations and browser
   instances currently authenticated with your enterprise credentials.";
   outline **"Refresh"** button.
2. **Notifications** (conditional): success "Session invalidated. The associated
   access token has been revoked."; error banner.
3. **Table card** — header row `p-5/6 pb-4 border-b`:
   - H2 **"Authorized Devices"**
   - Subtitle "Revoking a session immediately terminates its token in the
     authentication directory."
   - Right badge: "N Active Session(s)".
4. **Table** (`min-w-[760px]`, horizontally scrollable) columns:
   - **Device & Workstation** (min 300) — icon tile (Laptop/Smartphone from parsed
     UA), device name (parsed "Browser on OS"), optional green badge "Current Device",
     truncated raw user-agent in mono with tooltip on hover.
   - **IP Address** (min 140) — Globe icon + mono IP (strips `/32`).
   - **Last Active** (min 120) — `formatRelativeTime` (e.g. "2m ago").
   - **Signed In** (min 160) — `formatDateTime(created_at)`.
   - **Action** (min 110, right) — destructive **"Revoke"** button (Trash2) / or
     muted "This Device" text for the current session; while revoking → "Revoking…".
5. **Empty/loading row** (`colSpan=5`, `h-32`):
   - Loading: spinner + "Checking session directory…"
   - Empty: ShieldCheck icon + "No active sessions found" + "Sign in on a device
     to see it listed here."

### ASCII wireframe

```
+ DashboardShell ----------------------------------------------------------------+
| Active Sessions                                             [Refresh]          |
| Workstations and browser instances currently authenticated with your credentials|
+--------------------------------------------------------------------------------+
| {green: ✓ Session invalidated. The associated access token has been revoked.}    |  <- conditional
| {red: (!) <error>}                                                               |
+--------------------------------------------------------------------------------+
| +----------------------------------------------------------------------------+ |
| | Authorized Devices                                      [3 Active Sessions]  | |
| | Revoking a session immediately terminates its token in the auth directory. | |
| +----------------------------------------------------------------------------+ |
| | DEVICE & WORKSTATION     | IP ADDRESS   | LAST ACTIVE | SIGNED IN    | ACTION | |
| |--------------------------+--------------+-------------+--------------+--------| |
| | [lap] Chrome on macOS    | globe 10.0.0.5 | 2m ago    | Nov 23, 10:40| This   | |
| |       ( Current Device )  |              |             |              | Device | |
| |       Mozilla/5.0 (Mac…)  |              |             |              |        | |
| |--------------------------+--------------+-------------+--------------+--------| |
| | [lap] Chrome on Windows  | globe 10.0.0.9 | 1h ago    | Nov 23, 09:15| [Revoke]|
| |       Mozilla/5.0 (Wi…)   |              |             |              |        | |
| |--------------------------+--------------+-------------+--------------+--------| |
| | [mob] Safari on iOS      | globe 10.0.1.2 | 3d ago    | Nov 20, 14:02| [Revoke]|
| |       Mozilla/5.0 (iPh…)  |              |             |              |        | |
| +----------------------------------------------------------------------------+ |
| :: empty state: [shield] No active sessions found / Sign in on a device to …    |
+--------------------------------------------------------------------------------+
```

**After:** table header title-case, 13px; row height 44px; device cell shows parsed
name as primary text and raw UA as 12px muted second line (no tooltip needed if
truncated with title); "This Device" shown as a neutral badge; destructive action
kept but with a confirmation step for consistency with admin screens (proposal).

---

## 3. `/dashboard/settings` — Account & Security Settings

**Source:** `src/pages/dashboard/SettingsTab.tsx`
**Purpose:** change password, review enforced MFA, choose UI theme, revoke all
other workstations.

### Section inventory (in order)

1. **Page header** — H1 **"Account & Security Settings"**; subtitle "Manage your
   authentication credentials, multi-factor security, and interface preferences."
2. **Global notifications** (conditional): success message from revoke-all; error.
3. **2×2 card grid** (`grid-cols-1 lg:grid-cols-2 gap-5 items-stretch`).

**Card 1 (top-left) — Change Password** (icon `KeyRound`, badge outline "Credentials")
- Overline "Authentication Secret"; title "Change Password"; description "Update
  your corporate access credentials (minimum 12 characters)."
- `<form>` (`space-y-3.5`, `border-t`):
  - conditional success banner (password), conditional error banner.
  - "Current Password" input (placeholder "Enter current password", Eye toggle).
  - "New Password" input (placeholder "Minimum 12 characters", Eye toggle).
  - "Confirm New Password" input (placeholder "Repeat new password", Eye toggle).
  - Primary full-width **"Update Password"**; loading → "Updating Credentials…";
    disabled until all three fields non-empty.
- Validation (client): missing current; new <12 or >128 chars; mismatch; new
  identical to current. Backend: `api.changePassword` (with fallback endpoints).

**Card 2 (top-right) — Multi-Factor Authentication (MFA)** (icon `ShieldCheck`,
badge success "Enforced")
- Overline "Secondary Verification"; title "Multi-Factor Authentication (MFA)";
  description "Out-of-band verification required for all corporate logins."
- Detail rows (`border-t`): "Challenge Mode" (Lock icon) → "Email Challenge (OTP)";
  "Delivery Channel" → user email (mono, truncated); "Code Validity" (Clock icon)
  → "10 Minutes"; "Policy Status" → green check + "Mandatory Policy".
- **Security callout** at bottom: `bg-primary/5 border-primary/20`, Radio icon,
  text: "Multi-factor authentication is enforced across your corporate organization
  to protect against credential stuffing and session takeovers. Single-use OTP
  codes are dispatched automatically upon email and password verification."

**Card 3 (bottom-left) — Theme Preference** (icon `Sun`, badge outline "Interface")
- Overline "Display Styling"; title "Theme Preference"; description "Customize
  interface appearance for your device or follow system defaults."
- 3-column selector buttons (each with icon + label + small caption):
  - `Sun` / **Light** / "Executive"
  - `Moon` / **Dark** / "Carbon Slate"
  - `Monitor` / **System** / "OS Synchronized"
  - Active button: `border-primary bg-primary/10 text-primary font-semibold`.
- Footer row: "Active Mode" → mono uppercase current theme (e.g. `DARK`).

**Card 4 (bottom-right) — Revoke Other Workstations** (icon `Laptop`,
badge destructive "Danger Zone", card border `border-destructive/30`)
- Overline "Emergency Control" (destructive); title "Revoke Other Workstations";
  description "Terminate all active sessions across other devices. Your current
  workstation session will remain intact."
- Detail rows: "Revocation Scope" → "All sessions except current";
  "Token Invalidation" → destructive mono "Immediate & Irreversible".
- Destructive full-width **"Sign Out From All Other Devices"** (LogOut icon);
  loading → "Terminating other sessions…". Calls `api.getMySessions`, filters
  non-current, revokes each, then `refreshProfile()`.

### ASCII wireframe

```
+ DashboardShell ----------------------------------------------------------------+
| Account & Security Settings                                                     |
| Manage your authentication credentials, multi-factor security, and interface …    |
+--------------------------------------------------------------------------------+
| {green: ✓ Successfully terminated 2 other active session(s).}                   |  <- conditional
+--------------------------------------------------------------------------------+
| +------------------------------------+ +------------------------------------+ |
| | [key]              ( Credentials ) | | [shield]             ( Enforced )   | |
| | AUTHENTICATION SECRET              | | SECONDARY VERIFICATION             | |
| | Change Password                    | | Multi-Factor Authentication (MFA)    | |
| | Update your corporate access …     | | Out-of-band verification required… | |
| | ---------------------------------- | | ---------------------------------- | |
| | Current Password                   | | Challenge Mode    Email OTP         | |
| | [ Enter current password    (eye) ]| | Delivery Channel  user@company.com  | |
| | New Password                       | | Code Validity     10 Minutes       | |
| | [ Minimum 12 characters    (eye) ] | | Policy Status     ✓ Mandatory Policy| |
| | Confirm New Password               | |                                    | |
| | [ Repeat new password      (eye) ] | | (radio) Multi-factor authentication is| |
| | [>>>>> Update Password <<<<<<<<]   | | enforced across your corporate org…| |
| +------------------------------------+ +------------------------------------+ |
| +------------------------------------+ +------------------------------------+ |
| | [sun]                ( Interface ) | | [laptop]           ( DANGER ZONE )  | |
| | DISPLAY STYLING                    | | EMERGENCY CONTROL                  | |
| | Theme Preference                   | | Revoke Other Workstations          | |
| | Customize interface appearance …  | | Terminate all active sessions …    | |
| | ---------------------------------- | | ---------------------------------- | |
| | +--------+ +--------+ +---------+  | | Revocation Scope  All except current| |
| | |  sun   | |  moon  | | monitor |  | | Token Invalid.   Immediate & Irrev. | |
| | | Light  | | Dark   | | System  |  | |                                    | |
| | |Executive| |Carbon | |OS Sync  |  | | [!!! Sign Out From All Other Devices]|
| | +--------+ +--------+ +---------+  | |                                    | |
| | Active Mode                  DARK  | |                                    | |
| +------------------------------------+ +------------------------------------+ |
+--------------------------------------------------------------------------------+
```

**After:** keep 2×2 grid; raise card titles to 18px and body to 14px; theme selector
becomes 3 segmented tiles with 12px label; Danger Zone card uses a 4px left border
in `#B91C1C` instead of tinted background; password form uses the shared form
rules (label/helper/error spacing).
