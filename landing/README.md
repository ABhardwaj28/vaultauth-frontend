# VaultAuth SSO — Enterprise Landing Page

Modern, high-converting enterprise identity & access landing page built for modern identity teams.

## Features

- **Square-cornered dark interface** with a blended gradient canvas and amber action color.
- **Hero workbench**: decoded sample ID-token claims and a real in-browser S256 PKCE challenge generator.
- **Truthful capabilities**: Argon2id hashing, mandatory email OTP, opaque session tokens, session revocation, RBAC, audit logs, and live OIDC endpoints. Unsupported features (SAML/SCIM, real WebAuthn, published SDKs, invented SLAs) are not claimed.
- **Scroll-driven security walkthrough**: password entry, six-digit OTP with a live timer, session kill-switch with audit log, and an OAuth client registry. An animated cursor drives each step.
- **Four-stage pipeline** with gap-only connectors and clickable protocol specifications.
- **Six-pillar feature grid** linking to the relevant sections on this page.
- **Developer surface** listing real OIDC/REST endpoints from the live API, plus framework examples with copy buttons.
- **Capability tiers** on the landing page, with an illustrative cost estimator on a separate `/pricing.html` page opened from the top Pricing link; no invented prices.
- **Five FAQs**, plus a temporary documentation 403 page and an Atlassian-style live API status page.

## 🛠️ Tech Stack

- **Framework**: Vite + React 18 + TypeScript
- **Styling**: Tailwind CSS + Glassmorphism + Radix UI primitives
- **Icons**: Lucide React
- **Runtime & Package Manager**: Bun

## ⚡ Quickstart

```bash
# Install dependencies
bun install

# Start local development server (runs on http://localhost:3001)
bun run dev

# Run type check
bun run typecheck

# Production build
bun run build
```
