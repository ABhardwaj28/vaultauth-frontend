import type { ReactNode } from "react";
import { Database, FileCode2, Fingerprint, KeyRound, ShieldCheck, Timer } from "lucide-react";
import { SpotlightCard } from "./ui/SpotlightCard";
import { Reveal, SectionHeading, SeeLive } from "./ui/primitives";

const pillars: { icon: ReactNode; title: string; body: string; meta: string; href: string; link: string }[] = [
  {
    icon: <Fingerprint className="h-5 w-5" />,
    title: "Hosted login & verification",
    body: "Registration validates a 12–128 character password against NIST SP 800-63B rules. Accounts stay PENDING until a six-digit email code is confirmed.",
    meta: "FR-01, FR-02, PENDING to ACTIVE",
    href: "/register",
    link: "Open registration",
  },
  {
    icon: <ShieldCheck className="h-5 w-5" />,
    title: "Argon2id password vault",
    body: "Passwords exist only as memory-hard Argon2id hashes. A database constraint rejects any row whose hash does not begin with the argon2id identifier.",
    meta: "m=65536, t=3, p=4",
    href: "/dashboard/settings",
    link: "Open password settings",
  },
  {
    icon: <KeyRound className="h-5 w-5" />,
    title: "Mandatory second factor",
    body: "A correct password starts a six-digit email OTP challenge delivered by Resend. TOTP authenticator enrollment is optional; three wrong codes invalidate the challenge.",
    meta: "10-minute expiry, 60s resend",
    href: "/dashboard/settings",
    link: "Open 2FA settings",
  },
  {
    icon: <Timer className="h-5 w-5" />,
    title: "Three-strike lockout",
    body: "Three consecutive password failures lock the account for exactly 300 seconds through an atomic SQL counter. Admins can also unlock manually.",
    meta: "300 seconds, auto-unlock",
    href: "/dashboard/profile",
    link: "Open lockout policy",
  },
  {
    icon: <Database className="h-5 w-5" />,
    title: "Instant session kill-switch",
    body: "Users revoke their own devices and admins terminate any session. Revoked tokens fail on the next API call; disabling an account ends all of its live sessions.",
    meta: "30-minute idle, 8-hour absolute",
    href: "/dashboard/sessions",
    link: "Open live sessions",
  },
  {
    icon: <FileCode2 className="h-5 w-5" />,
    title: "Real OIDC surface",
    body: "Discovery, JWKS, authorize, token, userinfo, and revocation endpoints, with RS256 signatures, PKCE, scopes openid / email / profile, and one-time client secrets.",
    meta: "RFC 7636, S256, RS256",
    href: "/dashboard/admin/apps",
    link: "Open OAuth clients",
  },
];

export function FeaturesGrid() {
  return (
    <section id="features" className="scroll-mt-24 py-24 sm:py-28">
      <div className="va-container">
        <Reveal>
          <SectionHeading
            eyebrow="Six pillars"
            title="The primitives behind every VaultAuth session"
            description="Every capability below is specified in PRD v2.0 and visible in the identity portal. Each card links to the exact screen where you can inspect it."
          />
        </Reveal>

        <div className="mt-14 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-4">
          {pillars.map((pillar, index) => (
            <Reveal key={pillar.title} delay={index * 0.05}>
              <SpotlightCard className="h-full rounded-xl border border-[#1E2838] bg-[#0E1420]">
                <div className="flex h-full flex-col p-3 sm:p-6">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#F07A26]/25 bg-[#F07A26]/10 text-[#F07A26] sm:h-10 sm:w-10">
                    {pillar.icon}
                  </span>
                  <h3 className="mt-3 font-display text-[12px] font-semibold leading-4 text-white sm:mt-5 sm:text-[17px] sm:leading-6">{pillar.title}</h3>
                  <p className="mt-2 flex-1 text-[10px] leading-4 text-[#94A3B8] sm:mt-2.5 sm:text-[13px] sm:leading-6">{pillar.body}</p>
                  <div className="mt-5 border-t border-[#1E2838] pt-4">
                    <p className="font-mono text-[11px] text-[#F07A26]">{pillar.meta}</p>
                    <div className="mt-3"><SeeLive href={pillar.href}>{pillar.link}</SeeLive></div>
                  </div>
                </div>
              </SpotlightCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
