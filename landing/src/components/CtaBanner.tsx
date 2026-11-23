import { Database, FileCode2, KeyRound } from "lucide-react";
import { Reveal, ctaPrimaryInk, ctaSecondary } from "./ui/primitives";
import { API_REPO } from "../lib/links";

const actions = [
  {
    icon: KeyRound,
    title: "Create an account",
    body: "Register, verify your email, and sign in with password plus OTP.",
    href: "http://localhost:3000/register",
    label: "Open registration",
    primary: true,
  },
  {
    icon: Database,
    title: "Launch the portal",
    body: "Inspect sessions, OAuth clients, and the audit trail from the dashboard.",
    href: "http://localhost:3000/login",
    label: "Open sign in",
    primary: false,
  },
  {
    icon: FileCode2,
    title: "Read the API source",
    body: "Browse the backend repository and OpenAPI definitions.",
    href: API_REPO,
    label: "View repository",
    primary: false,
  },
];

export function CtaBanner() {
  return (
    <section id="final-cta" className="scroll-mt-24 py-24 sm:py-28">
      <div className="va-container">
        <Reveal>
          <div className="relative overflow-hidden rounded-2xl border border-[#F07A26]/20 bg-gradient-to-br from-[#1a120c] via-[#0E1420] to-[#080C14] px-6 py-16 text-center sm:px-12">
            <div className="pointer-events-none absolute left-1/2 top-0 h-80 w-[760px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_top,rgba(240,122,38,0.2),transparent_70%)]" />
            <div className="va-grid pointer-events-none absolute inset-0 opacity-[0.15]" />
            <div className="relative">
              <h2 className="mx-auto max-w-2xl font-display text-4xl font-extrabold leading-[1.12] tracking-[-0.04em] text-white sm:text-[52px]">
                Inspect the protocol. Then ship sign-in.
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-[15px] leading-7 text-[#94A3B8]">
                Real endpoints, real algorithms, real revocation. Start with the identity portal running on port 3000.
              </p>
              <div className="mt-9 flex flex-wrap justify-center gap-3">
                <a href="http://localhost:3000/register" className={ctaPrimaryInk}>Create free account</a>
                <a href="#developers" className={ctaSecondary}>Explore the protocol</a>
              </div>
            </div>
          </div>
        </Reveal>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Reveal key={action.title} delay={index * 0.06}>
                <a href={action.href} target={action.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="flex h-full flex-col rounded-xl border border-[#1E2838] bg-[#0E1420] p-6 transition-colors hover:border-[#F07A26]/40">
                  <Icon className="h-5 w-5 text-[#F07A26]" />
                  <p className="mt-4 font-display text-base font-semibold text-white">{action.title}</p>
                  <p className="mt-2 flex-1 text-[13px] leading-6 text-[#94A3B8]">{action.body}</p>
                  <span className={`mt-5 text-[13px] font-semibold ${action.primary ? "text-[#F07A26]" : "text-white"}`}>{action.label}</span>
                </a>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
