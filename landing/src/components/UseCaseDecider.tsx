import { useState, type KeyboardEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, Building2, Check, Fingerprint, ShieldCheck } from "lucide-react";
import { Reveal, SectionHeading, ctaSecondary } from "./ui/primitives";

const cases = [
  {
    id: "b2c",
    label: "Customer identity", short: "B2C",
    icon: Fingerprint,
    title: "A sign-in your customers can trust",
    body: "Hosted registration, email verification, Argon2id vaulting, and a mandatory OTP challenge before any session is issued.",
    features: ["Email verification before activation", "Six-digit email OTP with 10-minute expiry", "Uniform credential errors prevent enumeration"],
    preview: [
      { label: "Sign in", value: "Email + password" },
      { label: "Second factor", value: "Email OTP required" },
      { label: "On success", value: "Opaque 256-bit token" },
    ],
    spec: "Argon2id · m=65536, t=3, p=4",
  },
  {
    id: "b2b",
    label: "B2B workspaces", short: "B2B",
    icon: Building2,
    title: "Roles and boundaries your admins expect",
    body: "A server-enforced RBAC split between employees and administrators, with directory search, account status controls, and an audit trail.",
    features: ["Admin-only user management endpoints", "Role promotion and account disable", "Immutable audit events with IP attribution"],
    preview: [
      { label: "Employee", value: "Own sessions only" },
      { label: "Administrator", value: "Directory-wide control" },
      { label: "Audit", value: "30-day retained events" },
    ],
    spec: "Role checks enforced server-side",
  },
  {
    id: "m2m",
    label: "Machine clients", short: "M2M",
    icon: Bot,
    title: "Scoped access for non-human actors",
    body: "Register OAuth clients, exchange authorization codes with PKCE, and verify RS256 tokens locally against a published JWKS.",
    features: ["Authorization code + PKCE S256", "One-time client secret on creation", "RS256 signing with rotating key identifier"],
    preview: [
      { label: "Client", value: "Registered OAuth app" },
      { label: "Exchange", value: "/oauth/token" },
      { label: "Verify", value: "Local JWKS lookup" },
    ],
    spec: "OIDC Core · PKCE · RS256",
  },
];

export function UseCaseDecider() {
  const [active, setActive] = useState(0);
  const item = cases[active]!;

  const onTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % cases.length;
    else if (event.key === "ArrowLeft") next = (index - 1 + cases.length) % cases.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = cases.length - 1;
    else return;
    event.preventDefault();
    setActive(next);
    document.getElementById(`usecase-tab-${cases[next]!.id}`)?.focus();
  };

  return (
    <section id="solutions" className="scroll-mt-24 py-14 sm:py-16">
      <div className="va-container">
        <Reveal>
          <SectionHeading
            eyebrow="One identity layer, three jobs"
            title="Built for the way your team actually ships"
            description="Pick the surface you're working on. The underlying primitives stay the same: hashed credentials, verified second factors, revocable sessions, and standards-based tokens."
          />
        </Reveal>

        <div className="mt-9 grid grid-cols-3 gap-1 rounded-xl border border-[#1E2838] bg-[#0E1420] p-1.5 sm:gap-2" role="tablist" aria-label="Use cases">
          {cases.map((c, index) => {
            const Icon = c.icon;
            const edgeRadius =
              index === 0
                ? "rounded-l-xl rounded-r-lg"
                : index === cases.length - 1
                  ? "rounded-l-lg rounded-r-xl"
                  : "rounded-lg";
            return (
              <button
                key={c.id}
                type="button"
                role="tab"
                id={`usecase-tab-${c.id}`}
                aria-label={c.label}
                aria-selected={active === index}
                aria-controls={`usecase-panel-${c.id}`}
                tabIndex={active === index ? 0 : -1}
                onClick={() => setActive(index)}
                onKeyDown={(event) => onTabKeyDown(event, index)}
                className={`relative flex min-w-0 items-center justify-center gap-1.5 px-1.5 py-3 text-[11px] font-semibold transition-colors duration-200 sm:gap-2 sm:px-4 sm:text-sm ${edgeRadius} ${
                  active === index ? "bg-[#F07A26] va-amber-ink" : "text-[#94A3B8] hover:bg-white/[0.05] hover:text-white"
                }`}
              >
                <Icon className="relative z-10 h-4 w-4" />
                <span className="relative z-10 whitespace-nowrap sm:hidden">{c.short}</span>
                <span className="relative z-10 hidden whitespace-nowrap sm:inline">{c.label}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] sm:gap-8">
          <AnimatePresence mode="wait">
            <motion.div key={item.id} id={`usecase-panel-${item.id}`} role="tabpanel" aria-labelledby={`usecase-tab-${item.id}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.22 }}>
              <h3 className="font-display text-3xl font-bold tracking-[-0.03em] text-white sm:text-4xl">{item.title}</h3>
              <p className="mt-4 max-w-xl text-[15px] leading-7 text-[#94A3B8]">{item.body}</p>
              <ul className="mt-7 space-y-3">
                {item.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-white">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#F07A26]/15 text-[#F07A26]">
                      <Check className="h-3 w-3" />
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>
              <a href="#developers" className={`${ctaSecondary} mt-8`}>Explore the protocol</a>
            </motion.div>
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.div key={`${item.id}-preview`} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.22 }} className="rounded-2xl border border-[#1E2838] bg-[#0E1420] p-6 sm:p-8">
              <div className="flex items-center justify-between border-b border-[#1E2838] pb-3">
                <span className="text-xs font-semibold text-white">Runtime preview</span>
                <span className="inline-flex items-center gap-1.5 font-mono text-[10px] text-[#10B981]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#10B981]" /> ENFORCED
                </span>
              </div>
              <div className="mt-6 space-y-3">
                {item.preview.map((row, index) => (
                  <div key={row.label} className="flex items-center justify-between rounded-lg border border-[#1E2838] bg-[#080c14] px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded bg-[#F07A26]/10 font-mono text-[10px] text-[#F07A26]">0{index + 1}</span>
                      <span className="text-[13px] text-[#94A3B8]">{row.label}</span>
                    </div>
                    <span className="text-[13px] font-semibold text-white">{row.value}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex items-center gap-2 rounded-lg border border-[#10B981]/20 bg-[#10B981]/[0.05] p-3 text-[12px] text-[#10B981]">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                <span>{item.spec}</span>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
