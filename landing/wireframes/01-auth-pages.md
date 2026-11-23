# Wireframes — Authentication Pages

Covers `/login`, `/register`, `/verify-otp`. All three render inside `AuthShell`
(`src/components/layout/AuthShell.tsx`). See `00-overview.md` for the notation
legend and the before/after design direction.

---

## Shared AuthShell frame (all three routes)

**Source:** `src/components/layout/AuthShell.tsx`
**Purpose:** consistent public-facing frame — brand header, centered narrow card,
legal/trust footer.

Block order (top → bottom):
1. **Ambient background** — fixed, blurred amber blob (`blur-[130px]`, ~640×480) +
   radial top wash. No lines/circles.
2. **Top utility bar** — `border-b`, `bg-card/80 backdrop-blur-md`, `h-14`,
   `max-w-7xl px-4/6`.
   - Left: logo tile (ShieldCheck in amber-tinted tile) + "VaultAuth" (semibold
     small) + "SSO" (10px mono uppercase amber), links to `/`.
   - Right: `<ThemeToggle>` dropdown.
3. **Main center box** — `flex-1`, centered; inner `max-w-sm` card container.
4. **Footer** — `border-t`, `bg-card/60 backdrop-blur`, `text-xs text-muted-foreground`.
   - "© 2026 VaultAuth SSO • Enterprise Identity Gateway"
   - Links: "Privacy Policy" (→ `/privacy`) • "Terms of Service" (→ `/terms`) •
     "Zero-Trust Architecture" (plain text).

```
+------------------------------------------------------------------------------+
| AMBIENT WASH (blurred blob + radial gradient, behind everything)             |
+------------------------------------------------------------------------------+
| [shield] VaultAuth SSO                                    [theme dropdown]    |  <- header h-14
+------------------------------------------------------------------------------+
|                                                                              |
|                     +------------------------------------+                   |
|                     |  <page card — max-w-sm>            |                   |
|                     |  ... see per-page frames below ...  |                   |
|                     +------------------------------------+                   |
|                                                                              |
+------------------------------------------------------------------------------+
| © 2026 VaultAuth SSO • Enterprise Identity Gateway                           |
| Privacy Policy • Terms of Service • Zero-Trust Architecture                  |  <- footer
+------------------------------------------------------------------------------+
```

**After (shared):** flat canvas `#F6F7F9`, no ambient blob; header height 64px with
brand mark + wordmark; card max-width 420px, flat `#FFFFFF` surface, 1px border
`#E2E8F0`, radius 12px, padding 24px; footer single line, muted `#94A3B8`.

---

## 1. `/login` — Sign In to VaultAuth

**Source:** `src/pages/auth/LoginPage.tsx`
**Purpose:** enterprise email/password sign-in; branches to `/verify-otp` when the
backend returns an OTP challenge; receives a session-expired notice from AuthContext.
**Guard:** PublicOnly.

### Section inventory (in order)

1. **Card header** — centered, `pb-5`:
   - 40×40 amber-tinted tile with `ShieldCheck`.
   - H1: **"Sign In to VaultAuth"**.
   - Subtitle: "Enter your enterprise credentials to access protected single
     sign-on applications."
2. **`<form>`** (`space-y-4`), conditional banners first:
   - **Session-expired notice** (if `sessionExpiredNotice`): amber-tinted banner,
     AlertCircle + message (set by AuthContext, e.g. "Your session has expired.
     Please sign in again.").
   - **Error banner** (if `error`): destructive-tinted, AlertCircle + uppercase
     lead **"Authentication Error"** + message below.
   - **Email field**: Label "Corporate Email" (xs), input `type=email`, required,
     autoFocus, `autoComplete="email"`, placeholder `name@company.com`, Mail icon
     left, `pl-9 h-10 text-xs`. Typing clears error + expired notice.
   - **Password field**: row with Label "Password" + ghost text action
     **"Recovery Key"** (hover turns amber; no handler in source). Input
     `type=password|text`, Lock icon left, Eye/EyeOff toggle right (`tabIndex=-1`),
     placeholder `••••••••••••`, `autoComplete="current-password"`. Typing clears
     error + expired notice.
   - **Rate-limit cooldown banner** (if `rateLimitTimer > 0`): amber-tinted,
     Clock icon, mono text "Cooldown active: Retry in Ns" — counts down each second.
   - **Submit block** (`pt-2 space-y-3`):
     - Primary full-width `Button` **"Sign In"** (h-10, semibold, shadow-xs);
       while loading shows spinner + "Verifying Credentials…"; disabled while
       loading or during cooldown.
     - Centered text: "Don't have an enterprise account?" + link **"Sign up"** → `/register`.
3. **On mount:** `api.syncDisabledAccounts()` (silent background cache sync).

### Interactions / behavior grounded in source
- Submit validates non-empty email+password → error "Please provide both email
  address and password."
- Disabled account (live check / cache): "Account is disabled. Contact your administrator."
- Locked account: "Account is temporarily locked due to consecutive failed attempts.
  Contact your administrator or wait 5 minutes."
- 429: error "Too many login attempts. Please wait N seconds before trying again."
  + live cooldown; button re-enabled at 0.
- 502/503/504: "Authentication service is temporarily unavailable. Please try again shortly."
- Network/timeout: "Unable to reach VaultAuth authentication gateway. Please check
  your network connection."
- 401/invalid: uniform anti-enumeration message "Invalid email or password."
- 2FA required (`state === "OTP_REQUIRED"` or `challenge_id` or `requires_2fa`):
  `navigate(/verify-otp?email=…)` with state `{email, challengeId, expiresIn,
  isRegistration:false, redirectUrl}`.
- Success: `api.setToken`, `api.getMe`, `setAuthSession`, navigate to `redirect`
  query param or `/dashboard`.

### ASCII wireframe

```
+ AuthShell header: [shield] VaultAuth SSO                     [theme] ------------+
|                                                                                 |
|                  +------------------------------------------+                   |
|                  |            [shield tile]                |                   |
|                  |      Sign In to VaultAuth               |                   |
|                  |  Enter your enterprise credentials to    |                   |
|                  |  access protected SSO applications.     |                   |
|                  |                                          |                   |
|                  |  {optional: amber banner                 |                   |
|                  |   (!) Your session has expired…}         |                   |
|                  |  {optional: red banner                   |                   |
|                  |   (!) AUTHENTICATION ERROR               |                   |
|                  |       <error message>}                   |                   |
|                  |                                          |                   |
|                  |  Corporate Email                         |                   |
|                  |  [ @  name@company.com            ]      |                   |
|                  |                                          |                   |
|                  |  Password                 Recovery Key    |                   |
|                  |  [ *  ••••••••••••            (eye) ]     |                   |
|                  |                                          |                   |
|                  |  {optional amber: (clock) Cooldown       |                   |
|                  |   active: Retry in 42s}                  |                   |
|                  |                                          |                   |
|                  |  [>>>>>>>>>>>>> Sign In <<<<<<<<<<<<<]   |  primary          |
|                  |  Don't have an enterprise account?       |                   |
|                  |            (Sign up)                     |  -> /register     |
|                  +------------------------------------------+                   |
|                                                                                 |
+ footer: © 2026 … • Privacy Policy • Terms of Service • Zero-Trust --------------+
```

**After:** card 420px wide, padding 24px; title 24px semibold, subtitle 14px/secondary;
labels 13px; inputs 40px tall with 8px label gap; "Recovery Key" becomes a proper
text link (or is removed if it has no destination); banners use a 4px left accent
bar; single primary button; helper "Sign up" link on its own line with 12px gap.

---

## 2. `/register` — Create an Account

**Source:** `src/pages/auth/RegisterPage.tsx`
**Purpose:** self-service provisioning of a new corporate identity.
**Guard:** PublicOnly.

### Section inventory (in order)

1. **Card header** — centered, `pb-6`:
   - 40×40 amber tile with `ShieldCheck`.
   - H1: **"Create an Account"**.
   - Subtitle: "Provision a new corporate identity on the VaultAuth SSO realm."
2. **`<form>`** (`space-y-4`), conditional banners first:
   - **Success banner** (`Alert variant="success"`): CheckCircle2 +
     "Registration Initiated" + `successMessage` (default "Account created
     successfully! Check your email or sign in to continue.") + inline "Sign in now" link.
   - **Error banner** (`Alert variant="destructive"`): AlertCircle +
     "Registration Error" + message. Weak-password (422/`ERR_WEAK_PASSWORD`) uses
     backend message; otherwise "Registration failed. Please verify corporate email."
   - **Email field**: Label "Corporate Email", Mail icon, placeholder
     `employee@company.com`, `autoComplete="email"`, required, autoFocus.
   - **Password field**: Label "Master Password", Lock icon, Eye/EyeOff toggle,
     placeholder `••••••••••••`, `autoComplete="new-password"`.
     - **Live policy checklist** appears only when password is non-empty, in a
       `bg-muted/20` box:
       - `✓/○ Min 12 Characters (N/12)` — green when 12–128 chars.
       - 2-column grid: `✓/○ Uppercase`, `✓/○ Lowercase`, `✓/○ Number or Symbol`,
         and static "Max 128 Bytes".
   - **Confirm Password field**: Label "Confirm Password", Lock icon, Eye/EyeOff
     toggle; when typed shows mono hint `✓ Passwords match` (green) or
     `✕ Passwords do not match` (destructive).
   - **Submit block** (`pt-2 space-y-3`):
     - Primary full-width **"Create Account"**; loading → spinner +
       "Provisioning Account…"; **disabled** unless length valid AND passwords match
       (and not loading).
     - Centered text: "Already have an enterprise identity?" + link **"Sign In"** → `/login`.
3. **After submit:** `setTimeout(2500ms)` → `navigate('/login', { replace: true })`.
   (Note: the success path's "Sign in now" link is also present; the page also
   reads a `successMessage` from Login state on `/login`.)

### Validation messages (source)
- Empty: "Please provide all required fields."
- Length: "Password must be at least 12 characters and at most 128 bytes."
- Mismatch: "Passwords do not match."
- Weak password: backend message or "Password does not meet enterprise complexity
  requirements."

### ASCII wireframe

```
+ AuthShell header: [shield] VaultAuth SSO                     [theme] ------------+
|                                                                                 |
|                  +------------------------------------------+                   |
|                  |            [shield tile]                |                   |
|                  |         Create an Account               |                   |
|                  |  Provision a new corporate identity on   |                   |
|                  |  the VaultAuth SSO realm.               |                   |
|                  |                                          |                   |
|                  |  {green: (i) REGISTRATION INITIATED      |                   |
|                  |   <message> (Sign in now)}              |                   |
|                  |  {red: (i) REGISTRATION ERROR <message>} |                   |
|                  |                                          |                   |
|                  |  Corporate Email                         |                   |
|                  |  [ @  employee@company.com         ]     |                   |
|                  |                                          |                   |
|                  |  Master Password                         |                   |
|                  |  [ *  ••••••••••••             (eye) ]    |                   |
|                  |  +------------------------------+        |                   |
|                  |  | ✓ Min 12 Characters (14/12)  |        |  <- when typed     |
|                  |  | ✓ Uppercase   ✓ Lowercase    |        |                   |
|                  |  | ✓ Number or Symbol  Max 128B |        |                   |
|                  |  +------------------------------+        |                   |
|                  |                                          |                   |
|                  |  Confirm Password                        |                   |
|                  |  [ *  ••••••••••••             (eye) ]    |                   |
|                  |  ✓ Passwords match                       |  <- when typed     |
|                  |                                          |                   |
|                  |  [>>>>>>>>> Create Account <<<<<<<<<<<]   |  disabled unless  |
|                  |  Already have an enterprise identity?    |  policy satisfied  |
|                  |              (Sign In)                   |  -> /login         |
|                  +------------------------------------------+                   |
|                                                                                 |
+ footer: © 2026 … • Privacy Policy • Terms of Service • Zero-Trust --------------+
```

**After:** same frame as login; policy checklist becomes a compact 2-row list with
icons and plain text (not mono), green only for met rules, neutral for unmet;
"Max 128 Bytes" moves to helper text under the field; match/mismatch becomes a
standard inline validation message (icon + text).

---

## 3. `/verify-otp` — Two-Factor Verification

**Source:** `src/pages/auth/VerifyOtpPage.tsx`
**Purpose:** verify a 6-digit email OTP — either a 2FA login challenge
(`isRegistration=false`) or registration email verification (`type=register`).
**Guard:** PublicOnly. Params: `?email=…&challenge_id=…&type=register` or router
state `{email, challengeId, isRegistration, redirectUrl}`.

### Section inventory (in order)

1. **Card header** — centered, `pb-6`:
   - 40×40 amber tile with `KeyRound`.
   - H1: **"Two-Factor Verification"**.
   - Subtitle: "Enter the 6-digit security code dispatched to **{email}**" — the
     email rendered in mono with `text-foreground`; falls back to "your corporate email".
2. **`<form>`** (`space-y-5`):
   - **Error banner** (if `error`): destructive Alert with "Verification Failed"
     + message. Default "Invalid or expired security code. Attempts are rate-limited."
   - **Resend notice** (if `resendMessage`): success Alert, text
     "A new 6-digit verification code has been dispatched."
   - **OTP input** (`py-2`): `<OtpInput>` — six numeric cells, `h-12 w-10 sm:w-12`,
     `inputMode=numeric`, `autoComplete=one-time-code`, autoFocus first cell,
     arrow/Backspace navigation, paste support, error state = destructive border.
   - **Attempt + resend row** (`flex justify-between`, `font-mono text-xs`):
     - Left: "Attempts: **{N} of 3 left**" — red/bold when ≤1.
     - Right: button — during cooldown "Resend in Ns" (disabled); when ready,
       amber **"Resend Code"** with RefreshCw icon. Cooldown starts at 60s.
   - **Action block** (`pt-2 space-y-2`):
     - Primary full-width **"Verify & Proceed"**; loading → spinner +
       "Validating Passcode…"; disabled if code length < 6, loading, or 0 attempts.
     - Ghost full-width link-button **"Cancel & Return to Sign In"** → `/login`.

### Interactions / behavior grounded in source
- Each failed verify decrements `attemptsRemaining` (max 3 → 0); at 0 the OTP
  input and submit are disabled.
- Registration mode: `api.verifyEmail(email, code)` → `/login` with state
  `successMessage` (default "Email verified successfully! You may now sign in.").
- 2FA mode: `api.verify2FA({email, code, challenge_id})` → token → `getMe` →
  `setAuthSession` → navigate `redirectUrl` (default `/dashboard`).
- Resend: registration mode calls `api.resendVerifyEmail(email)`; both modes set
  success message, reset cooldown to 60s and attempts to 3. (Note: 2FA resend does
  not call a backend endpoint in the source — it only shows the notice.)

### ASCII wireframe

```
+ AuthShell header: [shield] VaultAuth SSO                     [theme] ------------+
|                                                                                 |
|                  +------------------------------------------+                   |
|                  |             [key tile]                  |                   |
|                  |      Two-Factor Verification            |                   |
|                  |  Enter the 6-digit security code        |                   |
|                  |  dispatched to {email}                  |                   |
|                  |                                          |                   |
|                  |  {red: (!) VERIFICATION FAILED           |                   |
|                  |       <error message>}                  |                   |
|                  |  {green: <resend message>}               |                   |
|                  |                                          |                   |
|                  |   +---+ +---+ +---+ +---+ +---+ +---+     |                   |
|                  |   |   | |   | |   | |   | |   | |   |     |  <- 6 numeric    |
|                  |   +---+ +---+ +---+ +---+ +---+ +---+     |     cells        |
|                  |                                          |                   |
|                  |  Attempts: 3 of 3 left      Resend in 60s |  <- cooldown      |
|                  |                             (Resend Code) |  <- when ready    |
|                  |                                          |                   |
|                  |  [>>>>>>>> Verify & Proceed <<<<<<<<<<]   |  primary          |
|                  |  [   Cancel & Return to Sign In        ]  |  ghost link       |
|                  +------------------------------------------+                   |
|                                                                                 |
+ footer: © 2026 … • Privacy Policy • Terms of Service • Zero-Trust --------------+
```

**After:** OTP cells 44×48px with 8px gaps, 16px semibold; keep auto-advance and
paste; replace mono attempt/resend row with regular 13px text, right-aligned text
link for resend; show a small "Didn't get it?" line above resend; keep attempts
as a neutral caption, red only at 1 or 0.

---

## Cross-page notes for implementation

- All three cards share the same width/padding so transitions feel continuous.
- The `Recovery Key` label on `/login` has no click handler in source — decide
  whether to wire it or drop it in the redesign.
- `sessionExpiredNotice` is only consumed by `/login`; keep its banner style
  distinct from errors (informational amber, not destructive).
- Loading labels are fully written out ("Verifying Credentials…",
  "Provisioning Account…", "Validating Passcode…") — preserve them; don't replace
  with bare spinners.
