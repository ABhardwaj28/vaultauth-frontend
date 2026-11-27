import { Activity, Check, FileCode2, KeyRound, Lock, Server } from "lucide-react";
import { Reveal, SectionHeading, ctaSecondary } from "./ui/primitives";
import { DOCS_LINK } from "../lib/links";
import { API_ORIGIN, useLiveHealth } from "../lib/liveApi";

const endpoints = [
  { method: "GET", path: "/.well-known/openid-configuration", note: "Discovery document", icon: FileCode2 },
  { method: "GET", path: "/.well-known/jwks.json", note: "RS256 public key", icon: KeyRound },
  { method: "GET", path: "/oauth/authorize", note: "Authorization + PKCE", icon: Lock },
  { method: "POST", path: "/oauth/token", note: "Code exchange", icon: Server },
  { method: "GET", path: "/oauth/userinfo", note: "Authenticated claims", icon: FileCode2 },
  { method: "POST", path: "/oauth/revoke", note: "Token revocation", icon: Lock },
  { method: "GET", path: "/health", note: "Service health", icon: Activity },
  { method: "GET", path: "/ready", note: "Database readiness", icon: Check },
];

const rest = [
  ["POST", "/api/v1/auth/register", "Uniform 'check your email' response"],
  ["POST", "/api/v1/auth/login", "Same 401 on every failure mode"],
  ["POST", "/api/v1/auth/mfa/verify", "Mints the opaque session token"],
  ["GET", "/api/v1/me/sessions", "Current user's active devices"],
  ["DELETE", "/api/v1/sessions/{id}", "Revoke a single session"],
  ["GET", "/api/v1/admin/audit-logs", "Admin-only event stream"],
  ["GET", "/api/v1/me", "Current profile"],
  ["POST", "/api/v1/auth/logout", "Invalidate session"],
];

const clientBehavior = [
  "Bearer tokens stay in memory and sessionStorage, cleared on sign-out or any 401",
  "X-Request-ID and X-RateLimit-* headers parsed on every response",
  "Slow container wake-ups surface a non-blocking notice after two seconds",
  "CSP, X-Frame-Options DENY, nosniff, and strict referrer policy deployed on the client",
];

const facts = [
  ["Grant type", "authorization_code"],
  ["Code challenges", "S256, plain"],
  ["ID token signing", "RS256"],
  ["Scopes", "openid, email, profile"],
  ["Supported claims", "sub, iss, aud, exp, iat, auth_time, email, email_verified, role, name"],
  ["Client auth", "client_secret_basic, client_secret_post, none"],
];

export function DevelopersSection() {
  const healthy = useLiveHealth();
  return (
    <section id="developers" className="scroll-mt-24 border-y border-[#1E2838] bg-white/[0.012] py-14 sm:py-16">
      <div className="va-container">
        <Reveal>
          <SectionHeading
            eyebrow="Developer surface"
            title="A protocol you can inspect today"
            description="The discovery document, signing keys, and OAuth endpoints are live. Bring your own HTTP client and verify the claims yourself."
          />
        </Reveal>

        <div className="mt-9 grid gap-5 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] sm:gap-6">
          <Reveal>
            <div className="overflow-hidden rounded-xl border border-[#1E2838] bg-[#0E1420]">
              <div className="flex items-center justify-between border-b border-[#1E2838] px-5 py-3">
                <p className="text-xs font-semibold text-white">Live endpoints</p>
                <span className="font-mono text-[10px] text-[#10B981]">{API_ORIGIN.replace("https://", "")}</span>
              </div>
              <div className="divide-y divide-[#1E2838]">
                {endpoints.map((endpoint) => {
                  const Icon = endpoint.icon;
                  return (
                    <a key={endpoint.path} href={`${API_ORIGIN}${endpoint.path}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-white/[0.03]">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[#1E2838] text-[#F07A26]"><Icon className="h-4 w-4" /></span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-mono text-[11px] text-white">{endpoint.path}</span>
                        <span className="block text-[11px] text-[#94A3B8]">{endpoint.note}</span>
                      </span>
                      <span className={`rounded px-2 py-0.5 font-mono text-[10px] ${endpoint.method === "POST" ? "bg-[#F07A26]/15 text-[#F07A26]" : "bg-[#10B981]/10 text-[#10B981]"}`}>{endpoint.method}</span>
                    </a>
                  );
                })}
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="rounded-xl border border-[#1E2838] bg-[#0E1420] p-6 sm:p-7">
              <p className="text-xs font-semibold text-white">Discovery facts</p>
              <div className="mt-5 space-y-3">
                {facts.map(([key, value]) => (
                  <div key={key} className="flex flex-wrap items-start justify-between gap-2 border-b border-[#1E2838] pb-3 last:border-0">
                    <span className="text-[12px] text-[#94A3B8]">{key}</span>
                    <span className="max-w-[65%] break-words text-right font-mono text-[11px] text-white">{value}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 space-y-2 rounded-lg border border-[#1E2838] bg-[#080c14] p-4">
                {healthy === true ? (
                  <>
                    <p className="flex items-center gap-2 font-mono text-[11px] text-[#10B981]"><Check className="h-3.5 w-3.5" /> GET /health → {`{ status: ok }`}</p>
                    <p className="flex items-center gap-2 font-mono text-[11px] text-[#10B981]"><Check className="h-3.5 w-3.5" /> API reachable from this browser</p>
                  </>
                ) : healthy === false ? (
                  <p className="font-mono text-[11px] text-[#F07A26]">API checks unavailable — see the status page</p>
                ) : (
                  <p className="font-mono text-[11px] text-[#94A3B8]">Checking API status…</p>
                )}
              </div>
              <a href={DOCS_LINK} target="_blank" rel="noreferrer" className={`${ctaSecondary} mt-6 w-full text-[13px]`}>See documentation</a>
            </div>
          </Reveal>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <Reveal>
            <div className="h-full rounded-xl border border-[#1E2838] bg-[#0E1420] p-6">
              <p className="text-xs font-semibold text-white">REST surface (PRD section 11)</p>
              <div className="mt-4 divide-y divide-[#1E2838]">
                {rest.map(([method, path, note]) => (
                  <div key={path} className="flex flex-wrap items-center gap-3 py-2.5">
                    <span className={`w-16 shrink-0 rounded px-1.5 py-0.5 text-center font-mono text-[10px] ${method === "GET" ? "bg-[#10B981]/10 text-[#10B981]" : "bg-[#F07A26]/10 text-[#F07A26]"}`}>{method}</span>
                    <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-white">{path}</span>
                    <span className="text-[11px] text-[#94A3B8]">{note}</span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.06}>
            <div className="h-full rounded-xl border border-[#1E2838] bg-[#0E1420] p-6">
              <p className="text-xs font-semibold text-white">Client security behavior</p>
              <div className="mt-4 space-y-3">
                {clientBehavior.map((item) => (
                  <p key={item} className="flex items-start gap-2 text-[12px] leading-6 text-[#94A3B8]">
                    <Check className="mt-1 h-3.5 w-3.5 shrink-0 text-[#F07A26]" /> {item}
                  </p>
                ))}
              </div>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.12}>
          <div className="mt-6 flex flex-wrap items-center gap-3 rounded-xl border border-[#1E2838] bg-[#080C14] px-5 py-4 text-[12px] text-[#94A3B8]">
            <Activity className="h-4 w-4 text-[#F07A26]" />
            Framework examples in the workbench are illustrative; the endpoints and algorithms above are served by the live API.
          </div>
        </Reveal>
      </div>
    </section>
  );
}
