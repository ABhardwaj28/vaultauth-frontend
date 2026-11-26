# VaultAuth SSO — Transactional Email Templates

HTML email templates for the out-of-band OTP flows, restyled to match the client
UI (dark carbon canvas, elevated slate card, hairline borders, signature amber,
Inter / Plus Jakarta Sans / JetBrains Mono).

## Templates

| File | Sent when | Suggested subject | Renderer |
| --- | --- | --- | --- |
| `otp-sign-in.html` | `POST /api/v1/auth/2fa` issues an email challenge | `Your VaultAuth verification code` | Jinja2 |
| `otp-verify-email.html` | `POST /api/v1/auth/register` or `/verify-email/resend` | `Verify your VaultAuth email` | Jinja2 |
| `otp-password-reset.html` | `POST /api/v1/auth/forgot-password` | `Reset your VaultAuth password` | Jinja2 |
| `otp-2fa.html` | Same 2FA challenge as `otp-sign-in.html` | `Your VaultAuth verification code` | `str.format()` |
| `password-reset.html` | Same reset flow as `otp-password-reset.html` | `Reset your VaultAuth password` | `str.format()` |
| `password-changed-notice.html` | An administrator changes a user's password | `Your VaultAuth password was changed` | Static (no placeholders) |
| `security-codes-reset-notice.html` | An administrator resets a user's security codes | `Your VaultAuth security codes were reset` | Static (no placeholders) |

## Administrative change notifications

`password-changed-notice.html` and `security-codes-reset-notice.html` are
minimal-disclosure notices. They state only that the event occurred and contain
no password, no codes, no administrator identity, no IP/device, and no timestamp.
They are static HTML with no placeholders, so nothing can be interpolated into
them by mistake. The admin UI confirms that these notices have been sent.

## `str.format()` variants

`otp-2fa.html` and `password-reset.html` are the dark-theme rewrites for a
`str.format()` renderer. They carry the same metadata as the Jinja2 templates:

```python
html = template.format(
    code="948057",
    formatted_code="9 4 8 0 5 7",
    email="shaurya@example.com",
    expiry_minutes=10,
    attempts_remaining=3,
    location="Bengaluru, IN",
    client_ip="103.218.111.98",
    device="Google Chrome on macOS",
    year=2026,
)
```

`{code}` goes into the hidden inbox preheader and `{formatted_code}` into the
visible code plate. `{email}`, `{expiry_minutes}`, `{attempts_remaining}`,
`{location}`, `{client_ip}`, `{device}` and `{year}` populate the delivery and
request-detail rows. All literal CSS braces are doubled (`{{ }}`) so formatting
leaves them intact. Rendered examples with sample values live in
`preview/otp-2fa.html` and `preview/password-reset.html`.

The `otp-*.html` files above still use Jinja2 — don't mix the two syntaxes.

## Placeholder contract

| Variable | Meaning | Example |
| --- | --- | --- |
| `{{ code }}` | 6-digit numeric OTP (rendered across six cells) | `948057` |
| `{{ email }}` | Recipient's corporate email | `shaurya@example.com` |
| `{{ expiry_minutes }}` | Challenge lifetime | `10` |
| `{{ attempts_remaining }}` | Attempts left before invalidation | `3` |
| `{{ location }}` | City/country resolved from the request IP | `Bengaluru, IN` |
| `{{ client_ip }}` | IP that initiated the request | `103.218.111.98` |
| `{{ device }}` | Browser / device label | `Google Chrome on macOS` |
| `{{ year }}` | Copyright year | `2026` |

> **Template engine:** placeholders use Jinja2 syntax. The six code cells use
> `{{ code[0] }}` … `{{ code[5] }}` to mirror the segmented input on
> `/verify-otp`. If your renderer is `str.format()` or a plain `replace()` map,
> either substitute the six cells individually or replace them with a single
> `{{ code }}` inside one cell using `letter-spacing: 12px`.

## Design tokens (source: `src/index.css` + `tailwind.config.js`)

| Token | Hex | Used for |
| --- | --- | --- |
| Canvas | `#0F1015` | Page background |
| Card | `#171821` | Main surface |
| Elevated inset | `#0F1015` | Code plate |
| Hairline | `#272A38` | Borders, dividers |
| Foreground | `#F3F4F6` | Headings, digits |
| Body | `#CBD5E1` | Paragraph text |
| Muted | `#94A3B8` | Meta text |
| Primary amber | `#F07A26` | Brand mark, accents |
| Destructive | `#7F2B32` / `#FCA5A5` | Reset warning (matches `destructive`) |

Light-mode overrides are in a `@media (prefers-color-scheme: light)` block at the
top of each file for clients that support it (Apple Mail, Outlook macOS, most
webmail). Dark is the base so the signature look holds everywhere.

## Preview

`preview/` holds rendered copies of all five templates with sample values (sample
code `948057`, `shaurya@example.com`) plus an `index.html` that links to each one,
so you can review every design in a browser. They are snapshots, not sources —
edit the templates in the parent folder.

## Email-client notes

- Table-based layout and inline styles for maximum client compatibility.
- Fonts load from Google Fonts with system fallbacks; webmail clients that block
  the import fall back to Inter → system sans, and JetBrains Mono → Menlo.
- The hidden preheader is stripped by some clients — that's fine, it only affects
  the inbox preview line.
- No external images. The brand mark is a styled glyph, so there are no asset
  URLs to host or break.
- Keep the code in the body, never behind a link — this preserves the
  out-of-band property of the second factor and avoids phishing-style CTAs.

## Wiring into the backend (FastAPI + Resend)

```python
from pathlib import Path
from jinja2 import Environment

env = Environment(autoescape=True)
TEMPLATES = Path(__file__).parent / "templates"  # copy these files here

def render_otp(name: str, **context) -> str:
    template = env.from_string((TEMPLATES / name).read_text())
    return template.render(**context)

# await resend.emails.send({
#     "from": "VaultAuth SSO <security@your-domain>",
#     "to": [email],
#     "subject": "Your VaultAuth verification code",
#     "html": render_otp("otp-sign-in.html", code=code, email=email, ...),
# })
```

`autoescape=True` is safe here: all interpolations are plain values, and the
static markup is part of the template string rather than a variable.
