import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy, Terminal } from "lucide-react";
import { frameworks } from "./CodeSnippetDock";
import { ctaPrimaryInk, ctaSecondary } from "./ui/primitives";
import { copyText } from "../lib/clipboard";
import { API_ORIGIN } from "../lib/liveApi";
import { API_REPO } from "../lib/links";

type CopyKey = "code" | "install" | "discovery" | "failed";

export function QuickstartSection() {
  const [active, setActive] = useState(0);
  const [copyState, setCopyState] = useState<CopyKey | null>(null);
  const framework = frameworks[active]!;

  const copy = async (text: string, key: CopyKey) => {
    const copied = await copyText(text);
    setCopyState(copied ? key : "failed");
    window.setTimeout(() => setCopyState(null), 1600);
  };

  const commands = [framework.install, `curl ${API_ORIGIN}/.well-known/openid-configuration`];

  return (
    <section id="quickstarts" className="relative scroll-mt-24 overflow-hidden border-y border-[#1E2838] py-24 sm:py-28">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(240,122,38,0.14),transparent_60%)]" />
      <div className="va-grid pointer-events-none absolute inset-0 opacity-[0.1]" />

      <div className="va-container relative">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#F07A26]">Quickstarts</p>
          <h2 className="mt-4 font-display text-4xl font-extrabold leading-[1.1] tracking-[-0.04em] text-white sm:text-[52px]">
            Integrate auth into any stack in minutes
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-[15px] leading-7 text-[#94A3B8]">
            Framework examples mapped to VaultAuth&apos;s live OIDC endpoints. Register a client, point it at discovery, and verify tokens with the published RS256 key.
          </p>
        </div>

        {/* Segmented framework switcher */}
        <div className="mx-auto mt-12 flex max-w-4xl gap-1 overflow-x-auto rounded-lg border border-[#1E2838] bg-[#0E1420] p-1.5 pb-2 [scrollbar-width:thin]">
          {frameworks.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActive(index)}
              aria-pressed={active === index}
              className={`flex-1 whitespace-nowrap rounded-md px-4 py-3 text-[13px] font-semibold transition-all ${
                active === index ? "bg-[#F07A26] va-amber-ink shadow-[0_8px_20px_-10px_rgba(240,122,38,0.9)]" : "text-[#94A3B8] hover:bg-white/[0.05] hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-center text-[11px] text-[#94A3B8] sm:hidden">Swipe the strip to see more frameworks</p>

        <div className="mx-auto mt-6 max-w-4xl">
          <AnimatePresence mode="wait">
            <motion.div key={framework.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="overflow-hidden rounded-xl border border-[#1E2838] bg-[#080C14] shadow-[0_40px_90px_-55px_rgba(0,0,0,0.95)]">
              <div className="flex items-center gap-2 border-b border-[#1E2838] bg-[#0a0f18] px-5 py-3">
                <Terminal className="h-4 w-4 text-[#F07A26]" />
                <span className="font-mono text-[11px] text-[#94A3B8]">{framework.file}</span>
                <span className="ml-auto rounded border border-[#1E2838] px-2 py-0.5 font-mono text-[10px] text-[#94A3B8]">{framework.label}</span>
                <button type="button" onClick={() => copy(framework.code, "code")} className="inline-flex items-center gap-1.5 rounded border border-[#1E2838] px-2 py-1 font-mono text-[10px] text-[#94A3B8] hover:text-white">
                  {copyState === "code" ? <Check className="h-3 w-3 text-[#10B981]" /> : <Copy className="h-3 w-3" />}
                  {copyState === "code" ? "Copied" : copyState === "failed" ? "Try again" : "Copy code"}
                </button>
              </div>
              <div className="p-5 font-mono text-[12px] leading-7 sm:p-7 sm:text-[13px]">
                <p><span className="text-[#F07A26]">$</span> <span className="text-white">{framework.install}</span></p>
                <pre className="mt-3 max-h-[320px] overflow-auto whitespace-pre-wrap break-words rounded-lg border border-[#1E2838] bg-black/25 p-4 text-[11px] leading-6 text-slate-200 sm:text-[12px]">
                  <code>{framework.code}</code>
                </pre>
                <p className="mt-3 text-[#10B981]">✓ OIDC discovery reachable · JWKS published · RS256</p>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {commands.map((command, index) => {
              const key: CopyKey = index === 0 ? "install" : "discovery";
              return (
                <button
                  key={command}
                  type="button"
                  onClick={() => copy(command, key)}
                  className="group flex items-center gap-3 rounded-lg border border-[#1E2838] bg-[#0E1420] px-4 py-3 text-left transition-colors hover:border-[#F07A26]/50"
                >
                  <span className="font-mono text-[11px] text-[#94A3B8]">0{index + 1}</span>
                  <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-slate-200">{command}</span>
                  <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-[#94A3B8] group-hover:text-white">
                    {copyState === key ? <Check className="h-3.5 w-3.5 text-[#10B981]" /> : <Copy className="h-3.5 w-3.5" />}
                    {copyState === key ? "Copied" : copyState === "failed" ? "Try again" : "Copy"}
                  </span>
                </button>
              );
            })}
          </div>

          <p className="mt-6 text-center text-[11px] text-[#94A3B8]">
            Examples are illustrative. The discovery document, JWKS, and OAuth endpoints above are live.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <a href={API_REPO} target="_blank" rel="noreferrer" className={ctaPrimaryInk}>View API repository</a>
            <a href="/register" className={ctaSecondary}>Create free account</a>
          </div>
        </div>
      </div>
    </section>
  );
}
