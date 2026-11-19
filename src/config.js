/**
 * VaultAuth SSO — Client Configuration
 * Single Source of Truth for API Gateway, Versioning & Trademark Identity
 */
export const CONFIG = {
  API_BASE_URL: (typeof window !== "undefined" && window.__VAULTAUTH_API__) || "https://api.vaultauth.proplays2312.eu.org",
  APP_NAME: "VaultAuth SSO",
  BRAND_NAME: "VaultAuth",
  TRADEMARK_COLOR: "#F6821F", // Cloudflare Tangerine / Safety Amber
  NIST_MIN_PASSWORD_LENGTH: 12,
  VERSION: "v0.2.0-react",
};
