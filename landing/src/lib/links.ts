/** Temporary docs destination — a self-contained 403 page that follows the OS theme. */
export const DOCS_LINK = "/403.html";

/** In dev the landing runs on :3001 while the portal is on :3000; in prod both share an origin. */
export const portalHref = (path: string) =>
  import.meta.env.DEV ? `http://localhost:3000${path}` : path;
