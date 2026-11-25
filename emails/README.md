# VaultAuth SSO — Transactional Email Templates

HTML email templates for the out-of-band OTP flows, restyled to match the client
UI (dark carbon canvas, elevated slate card, hairline borders, signature amber,
Inter / Plus Jakarta Sans / JetBrains Mono).

## Templates

| File | Sent when | Suggested subject |
| --- | --- | --- |
| `otp-sign-in.html` | `POST /api/v1/auth/2fa` issues an email challenge | `Your VaultAuth verification code` |
| `otp-verify-email.html` | `POST /api/v1/auth/register` or `/verify-email/resend` | `Verify your VaultAuth email` |
| `otp-password-reset.html` | `POST /api/v1/auth/forgot-password` | `Reset your VaultAuth password` |

## Placeholder contract

| Variable | Meaning | Example |
| --- | --- | --- |
| `{{ code }}` | 6-digit numeric OTP (rendered across six cells) | `948057` |
| `{{ email }}` | Recipient's corporate email | `shaurya@example.com` |
| `{{ expiry_minutes }}` | Challenge lifetime | `10` |
| `{{ attempts_remaining }}` | Attempts left before invalidation | `3` |
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

`preview/` holds rendered copies of each template with sample values (sample code
`948057`, `shaurya@example.com`) so you can open them in a browser to review the
design. They are snapshots, not sources — edit the templates in the parent folder.

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
