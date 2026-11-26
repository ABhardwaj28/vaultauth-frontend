import { Activity } from "lucide-react";
import { BrandMark } from "./ui/primitives";
import { portalHref } from "../lib/links";
import { API_ORIGIN } from "../lib/liveApi";

const columns = [
  {
    title: "Platform",
    links: [
      { label: "Hosted login", href: "#solutions" },
      { label: "Argon2id vault", href: "#features" },
      { label: "Second factor", href: "#features" },
      { label: "Session control", href: "#showcase" },
      { label: "Audit trail", href: "#showcase" },
    ],
  },
  {
    title: "Architecture",
    links: [
      { label: "Request ingress", href: "#architecture" },
      { label: "Credential gate", href: "#architecture" },
      { label: "RS256 token layer", href: "#architecture" },
      { label: "PostgreSQL state", href: "#architecture" },
      { label: "Role separation", href: "#features" },
    ],
  },
  {
    title: "Developers",
    links: [
      { label: "Quickstarts", href: "#quickstarts" },
      { label: "OIDC discovery", href: `${API_ORIGIN}/.well-known/openid-configuration` },
      { label: "JWKS endpoint", href: `${API_ORIGIN}/.well-known/jwks.json` },
      { label: "Health check", href: `${API_ORIGIN}/health` },
      { label: "PKCE playground", href: "#top" },
    ],
  },
  {
    title: "Product",
    links: [
      { label: "Use cases", href: "#solutions" },
      { label: "Comparison", href: "#compare" },
      { label: "Plans & capacity", href: "#pricing" },
      { label: "Technical FAQs", href: "#faq" },
      { label: "Identity portal", href: portalHref("/login") },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-[#1E2838] bg-[#060910]">
      <div className="va-container py-12">
        <div className="grid gap-8 md:grid-cols-[minmax(0,1.4fr)_minmax(0,2.6fr)] sm:gap-12">
          <div>
            <a href="#top" className="flex items-center gap-2.5">
              <BrandMark />
              <span className="font-display text-[19px] font-bold tracking-[-0.03em] text-white">VaultAuth</span>
            </a>
            <p className="mt-5 max-w-xs text-[13px] leading-6 text-[#94A3B8]">
              An enterprise identity portal with Argon2id vaulting, mandatory 2FA, revocable sessions, and an inspectable OIDC surface.
            </p>
            <a href="/status.html" target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center gap-2 rounded-md border border-[#10B981]/25 bg-[#10B981]/[0.06] px-3 py-1.5 text-[12px] text-[#10B981]">
              <Activity className="h-3.5 w-3.5" /> API status page
            </a>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {columns.map((column) => (
              <div key={column.title}>
                <p className="text-[13px] font-semibold text-white">{column.title}</p>
                <ul className="mt-4 space-y-2.5">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <a href={link.href} target={link.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="text-[13px] text-[#94A3B8] transition-colors hover:text-white">
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
