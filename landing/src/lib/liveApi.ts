/** Shared, cached access to the live VaultAuth API without cross-origin console errors. */
import { useEffect, useState } from "react";

export const API_ORIGIN = "https://api.vaultauth.proplays2312.eu.org";

/** Dev uses the Vite proxy; production uses same-origin paths rewritten by Render. */
export const API_FETCH_BASE = import.meta.env.DEV ? "/va-api" : "";

export type KeyInfo = { kid: string; alg: string };

const FALLBACK_KEY: KeyInfo = { kid: "vaultauth-rsa-key", alg: "RS256" };
const CACHE_MS = 60_000;

type Cache<T> = { value: T; at: number };
let healthCache: Cache<boolean> | null = null;
let keyCache: Cache<KeyInfo> | null = null;
let healthInflight: Promise<boolean> | null = null;
let keyInflight: Promise<KeyInfo> | null = null;

async function getJson(path: string): Promise<unknown> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(`${API_FETCH_BASE}${path}`, { signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } finally {
    window.clearTimeout(timer);
  }
}

/** Cached so React StrictMode's double effect only issues one request. */
export function checkHealth(): Promise<boolean> {
  if (healthCache && Date.now() - healthCache.at < CACHE_MS) {
    return Promise.resolve(healthCache.value);
  }
  if (!healthInflight) {
    healthInflight = getJson("/health")
      .then((data) => {
        const ok = Boolean(data && typeof data === "object" && "status" in data && (data as { status?: string }).status === "ok");
        healthCache = { value: ok, at: Date.now() };
        return ok;
      })
      .catch(() => false)
      .finally(() => {
        healthInflight = null;
      });
  }
  return healthInflight;
}

/** Cached JWKS metadata for the hero token inspector. */
export function getKeyInfo(): Promise<KeyInfo> {
  if (keyCache && Date.now() - keyCache.at < CACHE_MS) {
    return Promise.resolve(keyCache.value);
  }
  if (!keyInflight) {
    keyInflight = getJson("/.well-known/jwks.json")
      .then((data) => {
        const key = (data as { keys?: Array<{ kid?: string; alg?: string }> })?.keys?.[0];
        const value: KeyInfo = key?.kid ? { kid: key.kid, alg: key.alg ?? "RS256" } : FALLBACK_KEY;
        keyCache = { value, at: Date.now() };
        return value;
      })
      .catch(() => FALLBACK_KEY)
      .finally(() => {
        keyInflight = null;
      });
  }
  return keyInflight;
}

/** Live health state for UI that should not assert availability without checking. */
export function useLiveHealth() {
  const [healthy, setHealthy] = useState<boolean | null>(null);
  useEffect(() => {
    let active = true;
    checkHealth().then((ok) => {
      if (active) setHealthy(ok);
    });
    return () => {
      active = false;
    };
  }, []);
  return healthy;
}
