import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Database, FileCode2, KeyRound, Lock, Network, ShieldCheck } from "lucide-react";
import { Reveal, SectionHeading } from "./ui/primitives";

const tiers = [
  {
    step: "01",
    title: "Request ingress",
    subsystem: "HTTPS API surface",
    description: "Registration, login, and OIDC endpoints sit behind a single FastAPI service. Uniform credential errors prevent account enumeration.",
    icon: ShieldCheck,
    specs: [
      { k: "Surface", v: "FastAPI over HTTPS" },
      { k: "Error contract", v: "ERR_INVALID_CREDENTIALS" },
      { k: "Enumeration", v: "Uniform 401 for all failures" },
      { k: "Client headers", v: "X-Request-ID, X-RateLimit-*" },
    ],
  },
  {
    step: "02",
    title: "Credential gate",
    subsystem: "Argon2id + email OTP",
    description: "Passwords are verified against memory-hard Argon2id hashes. A correct password only starts the challenge — it never mints a session.",
    icon: Lock,
    specs: [
      { k: "Algorithm", v: "argon2id" },
      { k: "Parameters", v: "m=65536, t=3, p=4" },
      { k: "Second factor", v: "6-digit OTP, 10 min" },
      { k: "Password policy", v: "NIST SP 800-63B, 12–128 chars" },
    ],
  },
  {
    step: "03",
    title: "Token layer",
    subsystem: "RS256 / OIDC Core",
    description: "OIDC discovery, JWKS, authorize, token, userinfo, and revocation endpoints expose a standards-based integration surface.",
    icon: KeyRound,
    specs: [
      { k: "Signing", v: "RS256 + published JWKS" },
      { k: "PKCE", v: "S256 and plain" },
      { k: "Scopes", v: "openid, email, profile" },
      { k: "Client auth", v: "basic, post, none" },
    ],
  },
  {
    step: "04",
    title: "State & audit",
    subsystem: "PostgreSQL + audit log",
    description: "Opaque 256-bit tokens are stored as SHA-256 hashes. Revoked sessions fail on the next request; security events are retained for 30 days.",
    icon: Database,
    specs: [
      { k: "Token storage", v: "SHA-256 hash in PostgreSQL" },
      { k: "Idle / absolute", v: "30 min / 8 hours" },
      { k: "Retention", v: "30-day audit and session purge" },
      { k: "Database roles", v: "vault_app, vault_migrator, vault_backup" },
    ],
  },
];

export function ArchitectureSection() {
  const [active, setActive] = useState(0);
  const tier = tiers[active]!;

  return (
    <section id="architecture" className="scroll-mt-24 border-y border-[#1E2838] py-24 sm:py-28">
      <div className="va-container">
        <Reveal>
          <SectionHeading
            eyebrow="The authentication pipeline"
            title="Four layers between a request and a trusted identity"
            description="Every stage is observable and independently enforced. Select a node to inspect the real protocol, parameter, or storage contract behind it."
          />
        </Reveal>

        <div className="relative mt-14">
          <div className="relative grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-4">
            {tiers.map((item, index) => {
              const Icon = item.icon;
              const isActive = active === index;
              return (
                <button
                  key={item.step}
                  type="button"
                  onClick={() => setActive(index)}
                  aria-pressed={isActive}
                  className={`rounded-xl border p-2.5 text-left transition-all sm:p-5 ${isActive ? "border-[#F07A26]/50 bg-[#121a28] shadow-[0_25px_60px_-40px_rgba(240,122,38,0.8)]" : "border-[#1E2838] bg-[#0E1420] hover:border-[#3a475c]"}`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`flex h-8 w-8 items-center justify-center rounded-lg border sm:h-11 sm:w-11 ${isActive ? "border-[#F07A26]/40 bg-[#F07A26]/10 text-[#F07A26]" : "border-[#1E2838] text-slate-500"}`}>
                      <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </span>
                    <span className="font-mono text-[9px] text-slate-500 sm:text-[11px]">{item.step}</span>
                  </div>
                  <h3 className="mt-3 font-display text-[11px] font-semibold leading-4 text-white sm:mt-5 sm:text-base sm:leading-6">{item.title}</h3>
                  <p className="mt-1 font-mono text-[8px] leading-3 text-[#F07A26] sm:text-[10px] sm:leading-4">{item.subsystem}</p>
                  <p className="mt-2 text-[9px] leading-4 text-[#94A3B8] sm:mt-3 sm:text-[12px] sm:leading-5">{item.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={tier.step} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.22 }} className="mt-6 rounded-xl border border-[#1E2838] bg-[#0E1420] p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1E2838] pb-4">
              <p className="flex items-center gap-2 font-mono text-xs text-white"><FileCode2 className="h-4 w-4 text-[#F07A26]" /> Stage {tier.step} specification · {tier.title}</p>
              <span className="rounded border border-[#10B981]/30 bg-[#10B981]/10 px-2 py-1 font-mono text-[10px] text-[#10B981]">VERIFIED IN CODEBASE</span>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">
              {tier.specs.map((spec) => (
                <div key={spec.k} className="rounded-lg border border-[#1E2838] bg-[#080c14] p-4">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500">{spec.k}</p>
                  <p className="mt-2 font-mono text-[13px] leading-5 text-white">{spec.v}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-7 gap-y-3 border-t border-[#1E2838] pt-8 text-[12px] text-slate-500">
          {["OIDC Core 1.0", "RFC 7636 PKCE", "RS256 + JWKS", "Argon2id", "Opaque bearer tokens", "RBAC"].map((label) => (
            <span key={label} className="inline-flex items-center gap-2"><Network className="h-3 w-3 text-[#F07A26]" /> {label}</span>
          ))}
        </div>
      </div>
    </section>
  );
}
