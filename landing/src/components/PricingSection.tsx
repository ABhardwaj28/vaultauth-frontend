import { Check } from "lucide-react";
import { Reveal, SectionHeading, ctaPrimaryInk, ctaSecondary } from "./ui/primitives";
import { DOCS_LINK } from "../lib/links";

const tiers = [
  {
    name: "Developer",
    summary: "Explore the full auth flow locally, on infrastructure you control.",
    delivery: "Self-hosted only",
    features: ["Registration & email verification", "Argon2id password vault", "Email OTP second factor", "Session list & self-revocation", "OIDC discovery and JWKS"],
    label: "See documentation",
    href: DOCS_LINK,
    primary: false,
  },
  {
    name: "Team",
    summary: "Run identity for a product team.",
    delivery: "Managed + self-hosted",
    features: ["Everything in Developer", "Admin session overview", "User status and role controls", "3-strike unlock workflow", "Security audit trail"],
    label: "Talk to the team",
    href: "#final-cta",
    primary: true,
  },
  {
    name: "Scale",
    summary: "Higher concurrency and operational depth.",
    delivery: "Managed + self-hosted",
    features: ["Everything in Team", "OAuth client registry", "One-time client secrets", "PKCE and RS256 token flows", "30-day audit retention"],
    label: "Talk to the team",
    href: "#final-cta",
    primary: false,
  },
  {
    name: "Sovereign",
    summary: "Your infrastructure, your controls.",
    delivery: "Managed + self-hosted",
    features: ["Everything in Scale", "Self-hosted deployment", "Private database schema roles", "Backup and standby topology", "Dedicated integration support"],
    label: "Talk to the team",
    href: "#final-cta",
    primary: false,
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="scroll-mt-24 py-14 sm:py-16">
      <div className="va-container">
        <Reveal>
          <SectionHeading
            align="center"
            eyebrow="Plans & capacity"
            title="Start with the protocol. Scale with the team."
            description="VaultAuth does not publish commercial rates here. Developer is self-hosted only; Team, Scale and Sovereign are available managed or self-hosted. Talk to the team for an actual quote."
          />
        </Reveal>

        <div className="mt-9 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-4">
          {tiers.map((tier, index) => (
            <Reveal key={tier.name} delay={index * 0.05}>
              <div className={`flex h-full flex-col rounded-xl border p-3 sm:p-6 ${tier.primary ? "border-[#F07A26]/50 bg-gradient-to-b from-[#F07A26]/[0.08] to-[#0E1420]" : "border-[#1E2838] bg-[#0E1420]"}`}>
                <h3 className="font-display text-[13px] font-bold text-white sm:text-lg">{tier.name}</h3>
                <p className="mt-2 min-h-[54px] text-[10px] leading-4 text-[#94A3B8] sm:min-h-[48px] sm:text-[13px] sm:leading-6">{tier.summary}</p>
                <p className="mt-4 font-mono text-[9px] text-[#F07A26] sm:text-[11px]">{tier.delivery}</p>
                <ul className="mt-4 flex-1 space-y-2 sm:mt-6 sm:space-y-2.5">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-1.5 text-[9px] leading-4 text-white sm:gap-2 sm:text-[12px] sm:leading-5">
                      <Check className="mt-0.5 h-3 w-3 shrink-0 text-[#F07A26] sm:h-3.5 sm:w-3.5" /> {feature}
                    </li>
                  ))}
                </ul>
                <a
                  href={tier.href}
                  target={tier.href === DOCS_LINK ? "_blank" : undefined}
                  rel={tier.href === DOCS_LINK ? "noreferrer" : undefined}
                  className={`${tier.primary ? ctaPrimaryInk : ctaSecondary} mt-5 justify-center text-[10px] sm:mt-7 sm:text-[13px]`}
                >
                  {tier.label}
                </a>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.1}>
          <p className="mx-auto mt-8 max-w-2xl text-center text-[12px] leading-6 text-slate-500">
            Want to model your own assumptions? Open the{" "}
            <a href="/pricing.html" className="text-[#F07A26] underline underline-offset-2 hover:text-white">cost estimator on the pricing page</a>. Commercial rates are provided by the VaultAuth team after a conversation.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
