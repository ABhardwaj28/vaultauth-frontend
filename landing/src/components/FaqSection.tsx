import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { Reveal, SectionHeading, ctaSecondary } from "./ui/primitives";
import { DOCS_LINK } from "../lib/links";

const faqs = [
  {
    q: "How are passwords stored?",
    a: "Only as Argon2id hashes on the server, with memory cost 65536 KB, 3 iterations, and parallelism 4. Plaintext passwords are never written to the database or logs.",
  },
  {
    q: "Does a correct password create a session?",
    a: "No. A valid password only starts the second-factor challenge. VaultAuth issues an opaque 256-bit bearer token after the six-digit email OTP is verified within its ten-minute window.",
  },
  {
    q: "How quickly does session revocation take effect?",
    a: "Revocation updates the session row immediately. The backend checks session status on each authenticated request, so a revoked token is rejected on its very next call — the full flow is specified at under 30 seconds end-to-end.",
  },
  {
    q: "Can my services verify tokens without calling VaultAuth?",
    a: "Yes. The published JWKS endpoint exposes the RS256 public key. Your services can verify signatures locally using a cached key set, using the discovery document for issuer and endpoint metadata.",
  },
  {
    q: "Are SAML, SCIM, or WebAuthn passkeys available?",
    a: "Not in this build. The PRD explicitly scopes external SAML/OIDC brokering and real FIDO2 credential negotiation out of v2.0. WebAuthn is presented as an architecture concept, not a working login method.",
  },
  {
    q: "Which OIDC flows are supported?",
    a: "Authorization code with PKCE (S256 or plain), scopes openid, email, and profile, and claims including sub, email, email_verified, role, and name. Tokens are signed with RS256; the token, userinfo, and revocation endpoints are live.",
  },
  {
    q: "How do I get started?",
    a: "Create an account on the identity portal, register and verify your email, then sign in with your password and OTP. From the dashboard you can inspect sessions, manage OAuth clients, and review the audit trail.",
  },
  {
    q: "Where does the browser keep my session token?",
    a: "In memory and sessionStorage, never localStorage. It is cleared when the tab closes, on sign out, and on any 401 response. Passwords go straight to the API over HTTPS and are never logged.",
  },
  {
    q: "What do the error pages actually show?",
    a: "Dedicated 403, 404, 429, and 500/503 views with technical diagnostics. The 429 page uses the X-RateLimit-Reset header to drive a live countdown, and a root error boundary catches unexpected client failures.",
  },
];

export function FaqSection() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="scroll-mt-24 border-t border-[#1E2838] bg-white/[0.012] py-24 sm:py-28">
      <div className="va-container grid gap-6 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] sm:gap-12">
        <Reveal>
          <SectionHeading eyebrow="Technical questions" title="Straight answers, no hedging" description="If it isn't implemented, we say so. If it is, we tell you exactly how it works." />
          <a href={DOCS_LINK} target="_blank" rel="noreferrer" className={`${ctaSecondary} mt-8`}>See documentation</a>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="divide-y divide-[#1E2838] border-y border-[#1E2838]">
            {faqs.map((faq, index) => {
              const isOpen = open === index;
              return (
                <div key={faq.q}>
                  <button type="button" onClick={() => setOpen(isOpen ? null : index)} aria-expanded={isOpen} className="flex w-full items-center justify-between gap-6 py-5 text-left">
                    <span className={`text-[15px] font-medium transition-colors ${isOpen ? "text-white" : "text-[#94A3B8] hover:text-white"}`}>{faq.q}</span>
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-transform ${isOpen ? "rotate-180 border-[#F07A26]/40 bg-[#F07A26]/15 text-[#F07A26]" : "border-[#1E2838] text-slate-500"}`}>
                      <ChevronDown className="h-3.5 w-3.5" />
                    </span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen ? (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.24 }} className="overflow-hidden">
                        <p className="max-w-2xl pb-6 pr-8 text-[14px] leading-7 text-[#94A3B8]">{faq.a}</p>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
