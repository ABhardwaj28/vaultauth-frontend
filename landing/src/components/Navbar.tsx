import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  Blocks,
  BookOpen,
  ChevronDown,
  FileCode2,
  Fingerprint,
  KeyRound,
  Menu,
  ScrollText,
  ShieldCheck,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { BrandMark, ctaPrimary, ctaPrimaryInk } from "./ui/primitives";
import { portalHref } from "../lib/links";
import { checkHealth } from "../lib/liveApi";

type Link = { title: string; description: string; href: string; icon: LucideIcon };
type Menu = {
  label: string;
  href: string;
  columns: { heading: string; links: Link[] }[];
  feature: { title: string; body: string; href: string };
};

const menus: Menu[] = [
  {
    label: "Solutions",
    href: "#solutions",
    columns: [
      {
        heading: "Identity flows",
        links: [
          { title: "Customer login", description: "Hosted sign-in with verified email and password", href: "#showcase", icon: Fingerprint },
          { title: "Mandatory 2FA", description: "Email OTP before any session is minted", href: "#features", icon: KeyRound },
          { title: "Machine clients", description: "OAuth clients and scoped bearer tokens", href: "#solutions", icon: Blocks },
        ],
      },
      {
        heading: "Administration",
        links: [
          { title: "Session control", description: "See and revoke active sessions across devices", href: "#showcase", icon: ShieldCheck },
          { title: "User governance", description: "Roles, status, and 3-strike account unlock", href: "#solutions", icon: Users },
          { title: "Audit trail", description: "Immutable security events with IP attribution", href: "#features", icon: ScrollText },
        ],
      },
    ],
    feature: {
      title: "One identity layer",
      body: "Argon2id vaulting, opaque tokens, and a real RS256 OIDC surface in a single platform.",
      href: "#architecture",
    },
  },
  {
    label: "Architecture",
    href: "#architecture",
    columns: [
      {
        heading: "Core systems",
        links: [
          { title: "Argon2id vault", description: "Memory-hard password hashing, m=65536 t=3 p=4", href: "#architecture", icon: ShieldCheck },
          { title: "OIDC protocol layer", description: "Authorization code flow with PKCE S256", href: "#architecture", icon: FileCode2 },
          { title: "Session store", description: "Opaque 256-bit tokens, hash-only persistence", href: "#architecture", icon: KeyRound },
        ],
      },
      {
        heading: "Trust controls",
        links: [
          { title: "3-strike lockout", description: "Five-minute automatic account lock", href: "#features", icon: Activity },
          { title: "Role separation", description: "User and admin authority enforced server-side", href: "#features", icon: Users },
          { title: "Instant revocation", description: "Revoked tokens fail on their very next request", href: "#showcase", icon: ShieldCheck },
        ],
      },
    ],
    feature: {
      title: "Built for scrutiny",
      body: "Read the live discovery document and inspect the signing keys yourself.",
      href: "#developers",
    },
  },
  {
    label: "Developers",
    href: "#developers",
    columns: [
      {
        heading: "Start here",
        links: [
          { title: "Quickstarts", description: "Framework examples you can copy and adapt", href: "#quickstarts", icon: BookOpen },
          { title: "OIDC discovery", description: "Endpoints, scopes, claims, and supported algorithms", href: "#developers", icon: FileCode2 },
          { title: "PKCE playground", description: "Generate a real S256 challenge in your browser", href: "#top", icon: KeyRound },
        ],
      },
      {
        heading: "Reference",
        links: [
          { title: "JWKS endpoint", description: "RS256 public key for local signature verification", href: "#developers", icon: Blocks },
          { title: "Token endpoint", description: "Authorization code exchange, client secret or PKCE", href: "#developers", icon: FileCode2 },
          { title: "Health & readiness", description: "Live service and database connectivity checks", href: "#developers", icon: Activity },
        ],
      },
    ],
    feature: {
      title: "Standards, not magic",
      body: "OpenID Connect Core, OAuth 2.0, PKCE, and RS256 — inspect every endpoint.",
      href: "#developers",
    },
  },
];

export function Navbar() {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [health, setHealth] = useState<"live" | "unknown">("unknown");
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    let active = true;
    checkHealth().then((ok) => {
      if (active) setHealth(ok ? "live" : "unknown");
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenMenu(null);
        setMobileOpen(false);
      }
    };
    const outside = (event: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) setOpenMenu(null);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", outside);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", outside);
    };
  }, []);

  const active = menus.find((menu) => menu.label === openMenu);

  return (
    <header
      ref={headerRef}
      className="fixed inset-x-0 top-0 z-50"
      onMouseLeave={() => setOpenMenu(null)}
    >
      <div
        className={`border-b transition-all duration-300 ${
          scrolled || openMenu || mobileOpen
            ? "border-[#1E2838] bg-[#080C14]/95 shadow-[0_18px_50px_-30px_rgba(0,0,0,0.95)] backdrop-blur-xl"
            : "border-transparent bg-[#080C14]/60 backdrop-blur-md"
        }`}
      >
        <div className="va-container flex h-[72px] items-center justify-between gap-6">
          <a href="#top" className="flex items-center gap-2.5" aria-label="VaultAuth home">
            <BrandMark />
            <span id="brand-name" className="font-display text-[19px] font-bold tracking-[-0.03em] text-white">VaultAuth</span>
          </a>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Main navigation">
            {menus.map((menu) => (
              <a
                key={menu.label}
                href={menu.href}
                onMouseEnter={() => setOpenMenu(menu.label)}
                onFocus={() => setOpenMenu(menu.label)}
                onClick={() => setOpenMenu(null)}
                aria-expanded={openMenu === menu.label}
                aria-haspopup="true"
                className={`relative flex items-center gap-1.5 rounded-md px-3.5 py-2 text-sm font-medium transition-colors duration-200 ${
                  openMenu === menu.label ? "text-white" : "text-[#94A3B8] hover:text-white"
                }`}
              >
                {openMenu === menu.label ? (
                  <motion.span
                    layoutId="nav-active-pill"
                    className="absolute inset-0 rounded-md bg-white/[0.08]"
                    transition={{ type: "spring", stiffness: 500, damping: 40 }}
                  />
                ) : null}
                <span className="relative z-10">{menu.label}</span>
                <ChevronDown className={`relative z-10 h-3.5 w-3.5 transition-transform duration-200 ${openMenu === menu.label ? "rotate-180" : ""}`} />
              </a>
            ))}
            <a href="/pricing.html" className="rounded-md px-3.5 py-2 text-sm font-medium text-[#94A3B8] hover:text-white">Pricing</a>
          </nav>

          <div className="hidden items-center gap-4 lg:flex">
            <a href="/status.html" target="_blank" rel="noreferrer">
              <span className="inline-flex items-center gap-2 rounded-md border border-[#1E2838] bg-[#0E1420] px-2.5 py-1.5 text-[11px] text-[#94A3B8]">
                <span className={`h-1.5 w-1.5 rounded-full ${health === "live" ? "bg-[#10B981]" : "bg-slate-500"}`} />
                {health === "live" ? "Service healthy" : "API reference"}
              </span>
            </a>
            <a href={portalHref("/login")} className="text-sm font-medium text-white hover:text-[#F07A26]">Sign in</a>
            <a href={portalHref("/register")} className={ctaPrimary}>Create free account</a>
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen((value) => !value)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            className="rounded-md p-2 text-white lg:hidden"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        <AnimatePresence>
          {active ? (
            <motion.div
              key="mega-panel"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.42, ease: [0.4, 0, 0.2, 1] }}
              className="absolute inset-x-0 top-full hidden overflow-hidden border-b border-[#1E2838] bg-[#080C14]/[0.98] shadow-[0_30px_60px_-35px_rgba(0,0,0,0.95)] backdrop-blur-2xl transition-colors duration-300 lg:block"
            >
              <div className="va-container py-8">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={active.label}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                    className="grid min-h-[210px] grid-cols-[1fr_1fr_290px] gap-10"
                  >
                {active.columns.map((column) => (
                  <div key={column.heading}>
                    <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">{column.heading}</p>
                    <div className="space-y-0.5">
                      {column.links.map((link) => {
                        const Icon = link.icon;
                        return (
                          <a key={link.title} href={link.href} onClick={() => setOpenMenu(null)} className="flex items-start gap-3 rounded-lg p-2.5 hover:bg-white/[0.04]">
                            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[#1E2838] bg-white/[0.02] text-[#F07A26]">
                              <Icon className="h-4 w-4" />
                            </span>
                            <span>
                              <span className="block text-sm font-medium text-white">{link.title}</span>
                              <span className="mt-0.5 block text-xs leading-5 text-[#94A3B8]">{link.description}</span>
                            </span>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                ))}
                <a href={active.feature.href} onClick={() => setOpenMenu(null)} className="rounded-xl border border-[#F07A26]/25 bg-gradient-to-br from-[#F07A26]/10 to-transparent p-5">
                  <p className="font-display text-lg font-semibold text-white">{active.feature.title}</p>
                  <p className="mt-2 text-[13px] leading-6 text-[#94A3B8]">{active.feature.body}</p>
                  <span className="mt-4 block text-[13px] font-semibold text-[#F07A26]">Explore this topic</span>
                  </a>
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {mobileOpen ? (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-h-[calc(100vh-100px)] overflow-y-auto border-b border-[#1E2838] bg-[#0b111c]/100 px-4 pb-8 pt-2 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.9)] lg:hidden">
            {menus.map((menu) => (
              <details key={menu.label} className="group border-b border-white/[0.06]">
                <summary className="flex cursor-pointer list-none items-center justify-between py-3.5 text-sm font-medium text-white">
                  {menu.label}
                  <ChevronDown className="h-4 w-4 text-slate-400 transition-transform group-open:rotate-180" />
                </summary>
                <div className="space-y-1 pb-3">
                  {menu.columns.flatMap((c) => c.links).map((link) => (
                    <a key={link.title} href={link.href} onClick={() => setMobileOpen(false)} className="block rounded-md px-3 py-2 text-sm text-[#94A3B8] hover:bg-white/[0.04] hover:text-white">
                      {link.title}
                    </a>
                  ))}
                </div>
              </details>
            ))}
            <a href="/pricing.html" onClick={() => setMobileOpen(false)} className="block py-3.5 text-sm font-medium text-white">Pricing</a>
            <div className="mt-4 grid gap-2">
              <a href={portalHref("/login")} className="rounded-lg border border-[#1E2838] px-5 py-3 text-center text-sm font-semibold text-white">Sign in</a>
              <a href={portalHref("/register")} className={`${ctaPrimaryInk} text-center`}>Create free account</a>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
