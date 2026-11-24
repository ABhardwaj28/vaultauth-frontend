/**
 * Tenant/organisation label for the identity portal.
 *
 * Set VITE_ORGANISATION_NAME at build time to brand the portal for a
 * third-party organisation. Until then the placeholder below is shown.
 */
export const ORGANISATION_NAME: string =
  (import.meta.env.VITE_ORGANISATION_NAME as string | undefined)?.trim() ||
  "Organisation name";
