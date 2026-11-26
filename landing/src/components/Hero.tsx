import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { Braces, Check, KeyRound, RefreshCw, ShieldCheck } from "lucide-react";
import { ctaPrimaryInk, ctaSecondary } from "./ui/primitives";
import { API_ORIGIN as API, getKeyInfo, useLiveHealth } from "../lib/liveApi";
import { DOCS_LINK, portalHref } from "../lib/links";
type Tab = "token" | "pkce";

const samplePayload = {
  iss: API,
  sub: "usr_4cabe68c0e5c4171",
  aud: "vaultauth-demo-client",
  role: "user",
  email: "apoorva@example.com",
  email_verified: true,
  amr: ["pwd", "otp"],
  iat: 1763894400,
  exp: 1763898000,
};

function base64url(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function Hero() {
  const reduce = useReducedMotion();
  const healthy = useLiveHealth();
  const [tab, setTab] = useState<Tab>("token");
  const [keyInfo, setKeyInfo] = useState({ kid: "loading", alg: "RS256" });
  const [verifier, setVerifier] = useState("");
  const [challenge, setChallenge] = useState("");
  const [step, setStep] = useState(0);
  const [running, setRunning] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const pkceTimers = useRef<number[]>([]);

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  const rotateX = useTransform(scrollYProgress, [0, 0.8], [10, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.8], [0.98, 1]);

  useEffect(() => {
    let active = true;
    getKeyInfo().then((info) => {
      if (active) setKeyInfo(info);
    });
    return () => {
      active = false;
    };
  }, []);

  const generateChallenge = async () => {
    if (running) return;
    setRunning(true);
    setStep(0);
    const v = base64url(crypto.getRandomValues(new Uint8Array(32)));
    setVerifier(v);
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(v));
    setChallenge(base64url(new Uint8Array(digest)));
    pkceTimers.current.forEach((timer) => window.clearTimeout(timer));
    pkceTimers.current = [
      window.setTimeout(() => setStep(1), 550),
      window.setTimeout(() => setStep(2), 1200),
      window.setTimeout(() => setStep(3), 1850),
      window.setTimeout(() => setRunning(false), 2100),
    ];
  };

  useEffect(() => {
    return () => pkceTimers.current.forEach((timer) => window.clearTimeout(timer));
  }, []);

  useEffect(() => {
    if (tab !== "pkce") {
      pkceTimers.current.forEach((timer) => window.clearTimeout(timer));
      pkceTimers.current = [];
      setRunning(false);
    }
  }, [tab]);

  const pkceSteps = [
    { label: "Client creates verifier", detail: "32 random bytes, Base64URL encoded" },
    { label: "S256 challenge sent to authorize", detail: "BASE64URL(SHA256(verifier))" },
    { label: "Authorization code returned", detail: "Single-use code bound to the challenge" },
    { label: "Token exchange at /oauth/token", detail: "Server verifies verifier, mints RS256 token" },
  ];

  return (
    <section id="top" ref={sectionRef} className="relative overflow-hidden pb-20 pt-28 lg:pb-28 lg:pt-32">
      <div className="pointer-events-none absolute left-1/2 top-[-380px] h-[760px] w-[1100px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(240,122,38,0.16),transparent_70%)]" />
      <div className="va-grid pointer-events-none absolute inset-0 opacity-25 [mask-image:linear-gradient(to_bottom,black,transparent_75%)]" />

      <div className="va-container relative grid grid-cols-1 items-center gap-10 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:gap-8 xl:gap-10">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex flex-wrap gap-2">
            {["Argon2id vault", "OIDC Core 1.0", "PKCE S256"].map((chip) => (
              <span key={chip} className="rounded-md border border-[#1E2838] bg-[#0E1420] px-2.5 py-1 text-[11px] text-[#94A3B8]">{chip}</span>
            ))}
          </div>

          <h1 className="mt-7 font-display text-[clamp(2.1rem,9vw,2.75rem)] font-extrabold leading-[1.06] tracking-[-0.04em] text-white sm:text-[58px] lg:text-[62px]">
            Identity for developers, security for the enterprise.
          </h1>

          <p className="mt-6 max-w-xl text-[16px] leading-8 text-[#94A3B8]">
            VaultAuth combines memory-hard password vaulting, mandatory email 2FA, opaque session tokens, and one-click revocation with a real RS256 OIDC surface. Inspect the protocol, then ship sign-in.
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            <a href={portalHref("/register")} className={ctaPrimaryInk}>Create free account</a>
            <a href={DOCS_LINK} target="_blank" rel="noreferrer" className={ctaSecondary}>See documentation</a>
          </div>

          <div className="mt-10 flex flex-nowrap items-center gap-x-4 border-t border-[#1E2838] pt-6 text-[11px] text-[#94A3B8] sm:gap-x-8 sm:text-[13px]">
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap sm:gap-2"><ShieldCheck className="h-3.5 w-3.5 shrink-0 text-[#F07A26] sm:h-4 sm:w-4" /> 256-bit opaque tokens</span>
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap sm:gap-2"><KeyRound className="h-3.5 w-3.5 shrink-0 text-[#F07A26] sm:h-4 sm:w-4" /> Revoked on next request</span>
          </div>
        </motion.div>

        {/* Interactive developer workbench */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          style={reduce ? undefined : { rotateX, scale, transformPerspective: 1200 }}
          className="relative mx-auto w-full min-w-0 max-w-[640px]"
        >
          <div className="absolute -inset-8 rounded-[36px] bg-[radial-gradient(circle,rgba(240,122,38,0.12),transparent_70%)] blur-2xl" />
          <div className="relative rounded-2xl border border-[#1E2838] bg-[#0E1420] p-2 shadow-[0_45px_100px_-45px_rgba(0,0,0,0.95)]">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-t-xl border-b border-[#1E2838] bg-[#0a0f18] px-3 py-2.5">
              <div className="flex items-center gap-1 rounded-lg border border-[#1E2838] bg-[#080c14] p-1">
                {([
                  { id: "token" as Tab, label: "Token inspector", icon: Braces },
                  { id: "pkce" as Tab, label: "PKCE flow", icon: KeyRound },
                ]).map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setTab(item.id)}
                      aria-label={item.label}
                      aria-pressed={tab === item.id}
                      className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-colors sm:text-xs ${
                        tab === item.id ? "bg-[#F07A26] va-amber-ink" : "text-[#94A3B8] hover:text-white"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">{item.label}</span>
                    </button>
                  );
                })}
              </div>
              <span className="inline-flex items-center gap-1.5 font-mono text-[10px] text-[#10B981]">
                <span className={`h-1.5 w-1.5 rounded-full ${healthy === false ? "bg-[#F07A26]" : "bg-[#10B981]"}`} />
                {healthy === false ? "API REFERENCE" : healthy === true ? "LIVE API" : "CHECKING API"}
              </span>
            </div>

            <div className="min-h-[700px] rounded-b-xl bg-[#060a11] p-4 sm:min-h-[500px] sm:p-5">
              <AnimatePresence mode="wait">
                {tab === "token" ? (
                  <motion.div key="token" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                    <div className="flex items-center justify-between border-b border-[#1E2838] pb-2">
                      <span className="text-xs font-semibold text-white">Decoded ID token claims</span>
                      <span className="rounded border border-[#10B981]/30 bg-[#10B981]/10 px-2 py-0.5 font-mono text-[10px] text-[#10B981]">
                        {keyInfo.alg} · {keyInfo.kid.slice(0, 22)}
                      </span>
                    </div>
                    <pre className="mt-4 whitespace-pre-wrap break-all font-mono text-[11px] leading-[1.75] text-slate-300">
                      <code>{JSON.stringify(samplePayload, null, 2)}</code>
                    </pre>
                    <div className="mt-4 grid gap-2 sm:grid-cols-3">
                      {[
                        { k: "Signing", v: "RS256" },
                        { k: "Verification", v: "JWKS" },
                        { k: "Factors", v: "pwd + otp" },
                      ].map((item) => (
                        <div key={item.k} className="rounded-lg border border-[#1E2838] bg-[#0e1420] p-3">
                          <p className="text-[10px] uppercase tracking-wider text-slate-500">{item.k}</p>
                          <p className="mt-1 font-mono text-[12px] text-white">{item.v}</p>
                        </div>
                      ))}
                    </div>
                    <p className="mt-4 text-[11px] leading-5 text-slate-500">
                      Sample claims follow the live discovery document. Verify real tokens locally against the published JWKS endpoint.
                    </p>
                  </motion.div>
                ) : null}

                {tab === "pkce" ? (
                  <motion.div key="pkce" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="space-y-4">
                    <div className="flex items-center justify-between border-b border-[#1E2838] pb-2">
                      <span className="text-xs font-semibold text-white">RFC 7636 authorization code + PKCE</span>
                      <button type="button" onClick={generateChallenge} disabled={running} className="inline-flex items-center gap-1.5 rounded border border-[#F07A26]/40 bg-[#F07A26]/10 px-2.5 py-1 font-mono text-[10px] text-[#F07A26] disabled:opacity-50">
                        <RefreshCw className={`h-3 w-3 ${running ? "animate-spin" : ""}`} /> {running ? "Running" : "Run handshake"}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {pkceSteps.map((s, index) => (
                        <div key={s.label} className={`rounded-lg border p-3 transition-colors ${step > index ? "border-[#10B981]/40 bg-[#10B981]/[0.06]" : step === index ? "border-[#F07A26]/50 bg-[#F07A26]/[0.07]" : "border-[#1E2838] bg-[#0e1420]"}`}>
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[10px] text-slate-500">0{index + 1}</span>
                            {step > index ? <Check className="h-3 w-3 text-[#10B981]" /> : null}
                          </div>
                          <p className="mt-1 text-[11px] font-semibold text-white">{s.label}</p>
                          <p className="mt-0.5 text-[10px] leading-4 text-slate-500">{s.detail}</p>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-2 rounded-lg border border-[#1E2838] bg-[#080d15] p-3 font-mono text-[10px]">
                      <p className="text-slate-500">code_verifier</p>
                      <p className="break-all text-[#F07A26]">{verifier || "— run the handshake to generate —"}</p>
                      <p className="mt-2 text-slate-500">code_challenge (S256)</p>
                      <p className="break-all text-[#10B981]">{challenge || "—"}</p>
                    </div>
                    <p className="font-mono text-[10px] text-slate-500">POST {API}/oauth/token</p>
                  </motion.div>
                ) : null}

              </AnimatePresence>
            </div>
          </div>

          <div className="mt-5 hidden w-fit items-center gap-2 rounded-lg border border-[#1E2838] bg-[#0E1420] px-3 py-2 shadow-xl md:flex">
            <ShieldCheck className="h-4 w-4 text-[#10B981]" />
            <div>
              <p className="text-[11px] font-semibold text-white">3 strikes, 5-minute lock</p>
              <p className="text-[10px] text-slate-500">Atomic database counter</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
