# VaultAuth SSO — Enterprise Landing Page

Modern, high-converting enterprise identity & access landing page inspired by [Auth0](https://auth0.com/).

## 🚀 Features

- **Auth0-Inspired Design Aesthetic**: Deep dark theme with glowing mesh gradients, Safety Amber accents (`#F6821F`), and clean typography.
- **Hero with Live SDK Code & Token Simulator**:
  - Interactive language switcher (`React`, `Node.js`, `FastAPI Python`, `Go`, `cURL`).
  - Interactive PKCE Token Simulator: executes mock OAuth 2.0 PKCE handshake and renders decoded RS256 JWT claims in real-time.
- **Performance & Trust Metrics**: High-availability SLAs (`99.999%`), sub-15ms edge token validation, and enterprise security proofs.
- **Interactive Product Showcase**:
  - Tab 1: Universal Login (Social SSO, FIDO2 WebAuthn Passkeys, Branded Hosted Login)
  - Tab 2: Adaptive 2FA Verification (6-digit TOTP challenge with countdown timer)
  - Tab 3: Live Forensic Audit Telemetry (Event streaming, strike limits, IP geolocations)
  - Tab 4: OAuth 2.0 App Directory (Client credentials, redirect URIs, scopes)
- **Zero-Trust Architecture Flow**: 4-tier security pipeline from Edge Threat Shield to RS256 Cryptographic Token Minting.
- **Comparison Matrix**: Side-by-side feature comparison: VaultAuth vs. Auth0 vs. Keycloak.
- **Transparent Pricing Calculator**: Developer ($0/mo), Professional ($49/mo), and Enterprise tiers.
- **Developer FAQ**: Expandable accordion covering migration, self-hosting, 2FA, and compliance.

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
