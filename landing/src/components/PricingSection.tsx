import { useState } from "react";
import { Check, Gauge, Info } from "lucide-react";
import { Reveal, SectionHeading, ctaPrimaryInk, ctaSecondary } from "./ui/primitives";
import { DOCS_LINK, portalHref } from "../lib/links";

const tiers = [
  {
    name: "Developer",
    summary: "Explore the full auth flow locally.",
    features: ["Registration & email verification", "Argon2id password vault", "Email OTP second factor", "Session list & self-revocation", "OIDC discovery and JWKS"],
    cta: "Create free account",
    primary: false,
  },
  {
    name: "Team",
    summary: "Run identity for a product team.",
    features: ["Everything in Developer", "Admin session overview", "User status and role controls", "3-strike unlock workflow", "Security audit trail"],
    cta: "Talk to the team",
    primary: true,
  },
  {
    name: "Scale",
    summary: "Higher concurrency and operational depth.",
    features: ["Everything in Team", "OAuth client registry", "One-time client secrets", "PKCE and RS256 token flows", "30-day audit retention"],
    cta: "Talk to the team",
    primary: false,
  },
  {
    name: "Sovereign",
    summary: "Your infrastructure, your controls.",
    features: ["Everything in Scale", "Self-hosted deployment", "Private database schema roles", "Backup and standby topology", "Dedicated integration support"],
    cta: "Talk to the team",
    primary: false,
  },
];

const inr = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

export function PricingSection() {
  const [mau, setMau] = useState(25000);
  const [rate, setRate] = useState(120);
  const [annual, setAnnual] = useState(true);
  const [deploy, setDeploy] = useState<"cloud" | "self">("cloud");

  const monthly = (mau / 1000) * rate;
  const effective = annual ? monthly * 0.8 : monthly;
  const annualTotal = effective * 12;
  const amountText = inr.format(effective);
  const amountSize =
    amountText.length > 9 ? "text-[26px]" : amountText.length > 7 ? "text-[30px]" : "text-[36px]";

  return (
    <section id="pricing" className="scroll-mt-24 py-24 sm:py-28">
      <div className="va-container">
        <Reveal>
          <SectionHeading
            align="center"
            eyebrow="Plans & capacity"
            title="Start with the protocol. Scale with the team."
            description="VaultAuth does not publish commercial rates here. Use the estimate below with your own assumptions, then talk to the team for an actual quote."
          />
        </Reveal>

        {/* Cost calculator — moved above the capability tiers */}
        <Reveal delay={0.05}>
          <div className="mx-auto mt-12 max-w-4xl rounded-2xl border border-[#1E2838] bg-[#0E1420]/70 p-6 shadow-[0_30px_80px_-50px_rgba(0,0,0,0.9)] sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="flex items-center gap-2 font-display text-lg font-semibold text-white"><Gauge className="h-5 w-5 text-[#F07A26]" /> Cost estimator</p>
                <p className="mt-1 text-[13px] text-[#94A3B8]">Set your expected users and an assumed rate to see an indicative monthly and annual figure.</p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-md border border-white/[0.06] bg-white/[0.03] px-2.5 py-1.5 text-[11px] text-[#94A3B8]">
                <Info className="h-3.5 w-3.5 text-[#F07A26]" /> Illustrative, not a quote
              </span>
            </div>

            <div className="mt-8 grid gap-8 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between">
                    <label htmlFor="mau" className="text-[13px] font-medium text-white">Monthly active users</label>
                    <span className="font-mono text-lg tabular-nums text-white">{inr.format(mau)}</span>
                  </div>
                  <input id="mau" type="range" min="1000" max="250000" step="1000" value={mau} onChange={(e) => setMau(Number(e.target.value))} className="mt-3 w-full rounded-lg accent-[#F07A26] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F07A26]/50" />
                  <div className="mt-1 flex justify-between font-mono text-[10px] text-slate-600"><span>1,000</span><span>250,000</span></div>
                </div>

                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label htmlFor="rate" className="text-[13px] font-medium text-white">Assumed ₹ per 1,000 MAU</label>
                    <div className="flex items-center gap-2 rounded-md border border-[#1E2838] bg-[#080C14] px-3 py-1.5 transition-colors focus-within:border-[#F07A26] focus-within:ring-1 focus-within:ring-[#F07A26]/40">
                      <span className="font-mono text-[12px] text-[#F07A26]">₹</span>
                      <input id="rate" type="number" min="0" max="10000" value={rate} onChange={(e) => setRate(Math.min(10000, Math.max(0, Number(e.target.value))))} className="w-16 bg-transparent text-right font-mono text-[13px] text-white outline-none" />
                    </div>
                  </div>
                  <p className="mt-2 text-[11px] leading-5 text-slate-500">Enter any rate you want to model. This is not a VaultAuth published price.</p>
                </div>

                <div>
                  <p className="text-[13px] font-medium text-white">Billing assumption</p>
                  <div className="mt-2 inline-flex rounded-lg border border-[#1E2838] bg-[#080C14] p-1">
                    {(["monthly", "annual"] as const).map((mode) => (
                      <button key={mode} type="button" onClick={() => setAnnual(mode === "annual")} className={`rounded-md px-4 py-1.5 text-[12px] font-medium capitalize transition-colors ${annual === (mode === "annual") ? "bg-[#F07A26] va-amber-ink" : "text-[#94A3B8] hover:text-white"}`}>
                        {mode}
                        {mode === "annual" ? <span className="ml-2 text-[10px] opacity-80">20% off</span> : null}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-white/[0.06] bg-black/25 p-5">
                <p className="text-[11px] uppercase tracking-[0.12em] text-slate-500">Estimated cost</p>
                <p className={`mt-3 flex items-baseline font-display font-extrabold tracking-[-0.04em] text-white ${amountSize}`}>
                  <span className="mr-0.5 text-[0.62em] font-semibold text-[#94A3B8]">₹</span>
                  <span className="tabular-nums">{amountText}</span>
                  <span className="ml-1 text-[0.38em] font-medium text-[#94A3B8]">/mo</span>
                </p>
                <p className="mt-1 text-[12px] text-[#94A3B8]">
                  {annual ? (
                    <span>
                      Billed yearly at ₹
                      <span className="tabular-nums text-white/90">{inr.format(annualTotal)}</span> per year
                    </span>
                  ) : (
                    <span>Billed monthly at your assumed rate</span>
                  )}
                </p>
                <div className="mt-6 space-y-3 border-t border-[#1E2838] pt-5 text-[12px]">
                  <div className="flex justify-between text-[#94A3B8]"><span>Users</span><span className="font-mono tabular-nums text-white">{inr.format(mau)} MAU</span></div>
                  <div className="flex justify-between text-[#94A3B8]"><span>Rate assumption</span><span className="font-mono tabular-nums text-white">₹{inr.format(rate)} / 1k MAU</span></div>
                  <div className="flex justify-between text-[#94A3B8]"><span>Before adjustment</span><span className="font-mono tabular-nums text-white">₹{inr.format(monthly)} /mo</span></div>
                  <div className="flex justify-between text-[#94A3B8]"><span>Deployment view</span><span className="font-mono text-white">{deploy === "cloud" ? "Managed cloud" : "Self-hosted"}</span></div>
                </div>
                <a href="#final-cta" className={`${ctaPrimaryInk} mt-6 w-full text-[13px]`}>Get a real quote</a>
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="mx-auto mt-6 flex w-fit items-center gap-1 rounded-lg border border-[#1E2838] bg-[#0E1420] p-1">
            {(["cloud", "self"] as const).map((mode) => (
              <button key={mode} type="button" onClick={() => setDeploy(mode)} className={`rounded-md px-4 py-2 text-[13px] font-medium transition-colors ${deploy === mode ? "bg-[#F07A26] va-amber-ink" : "text-[#94A3B8] hover:text-white"}`}>
                {mode === "cloud" ? "Managed cloud" : "Self-hosted"}
              </button>
            ))}
          </div>
        </Reveal>

        <div className="mt-12 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-4">
          {tiers.map((tier, index) => (
            <Reveal key={tier.name} delay={index * 0.05}>
              <div className={`flex h-full flex-col rounded-xl border p-3 sm:p-6 ${tier.primary ? "border-[#F07A26]/50 bg-gradient-to-b from-[#F07A26]/[0.08] to-[#0E1420]" : "border-[#1E2838] bg-[#0E1420]"}`}>
                <h3 className="font-display text-[13px] font-bold text-white sm:text-lg">{tier.name}</h3>
                <p className="mt-2 min-h-[54px] text-[10px] leading-4 text-[#94A3B8] sm:min-h-[48px] sm:text-[13px] sm:leading-6">{tier.summary}</p>
                <p className="mt-4 font-mono text-[9px] text-[#F07A26] sm:text-[11px]">{deploy === "self" ? "Self-hosted ready" : "Managed service"}</p>
                <ul className="mt-4 flex-1 space-y-2 sm:mt-6 sm:space-y-2.5">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-1.5 text-[9px] leading-4 text-white sm:gap-2 sm:text-[12px] sm:leading-5">
                      <Check className="mt-0.5 h-3 w-3 shrink-0 text-[#F07A26] sm:h-3.5 sm:w-3.5" /> {feature}
                    </li>
                  ))}
                </ul>
                <a
                  href={deploy === "self" ? DOCS_LINK : tier.name === "Developer" ? portalHref("/register") : "#final-cta"}
                  target={deploy === "self" ? "_blank" : undefined}
                  rel={deploy === "self" ? "noreferrer" : undefined}
                  className={`${tier.primary ? ctaPrimaryInk : ctaSecondary} mt-5 justify-center text-[10px] sm:mt-7 sm:text-[13px]`}
                >
                  {deploy === "self" ? "See documentation" : tier.cta}
                </a>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.1}>
          <p className="mx-auto mt-8 max-w-2xl text-center text-[12px] leading-6 text-slate-500">
            Capability tiers describe what the platform includes. Commercial rates are provided by the VaultAuth team after a conversation; the calculator above is a planning aid with a rate you choose yourself.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
