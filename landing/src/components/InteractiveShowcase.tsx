import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  Fingerprint,
  KeyRound,
  Plus,
  ShieldCheck,
  Terminal,
  Trash2,
} from "lucide-react";
import { SectionHeading, SeeLive } from "./ui/primitives";
import { copyText } from "../lib/clipboard";

const chambers = [
  { title: "Password shield", subtitle: "Argon2id and 3-strike lockout", route: "/dashboard/profile", link: "See lockout policy" },
  { title: "Second factor", subtitle: "Six-digit email OTP", route: "/dashboard/settings", link: "See 2FA settings" },
  { title: "Session kill-switch", subtitle: "Revoke a device instantly", route: "/dashboard/sessions", link: "See live sessions" },
  { title: "Client registry", subtitle: "Register an OAuth application", route: "/dashboard/admin/apps", link: "See OAuth clients" },
];

export function InteractiveShowcase() {
  const [active, setActive] = useState(0);

  // Chamber 1 — password shield
  const email = "shaurya@example.com";
  const [password, setPassword] = useState("");
  const [strikes, setStrikes] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);

  // Chamber 2 — OTP
  const [seconds, setSeconds] = useState(30);
  const [otp, setOtp] = useState("482913");
  const [verified, setVerified] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<"otp" | "secret" | "failed" | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          setOtp(String(Math.floor(100000 + Math.random() * 900000)));
          return 30;
        }
        return s - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  // Chamber 3 — sessions
  const [sessions, setSessions] = useState([
    { id: "s1", device: "Safari · macOS", ip: "103.24.18.9", active: true },
    { id: "s2", device: "Chrome · Windows", ip: "49.207.44.12", active: true },
    { id: "s3", device: "iPhone · Safari", ip: "117.239.8.41", active: false },
  ]);
  const [logs, setLogs] = useState<string[]>(["09:41  AUTH_SUCCESS  103.24.18.9"]);

  const revoke = (id: string) => {
    const session = sessions.find((s) => s.id === id);
    if (!session) return;
    setSessions((list) => list.map((s) => (s.id === id ? { ...s, active: false } : s)));
    setLogs((list) => [`now    SESSION_REVOKED  ${session.ip}`, ...list].slice(0, 4));
  };

  // Chamber 4 — OAuth clients
  const [clientName, setClientName] = useState("");
  const [redirectUri, setRedirectUri] = useState("http://localhost:3000/callback");
  const [secret, setSecret] = useState<string | null>(null);
  const [ack, setAck] = useState(false);

  const createClient = (event: React.FormEvent) => {
    event.preventDefault();
    if (!clientName || !ack) return;
    const bytes = crypto.getRandomValues(new Uint8Array(24));
    setSecret("va_secret_" + Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join(""));
  };

  const handleCopy = async (text: string, key: "otp" | "secret") => {
    const copied = await copyText(text);
    setCopyFeedback(copied ? key : "failed");
    window.setTimeout(() => setCopyFeedback(null), 1600);
  };

  return (
    <section id="showcase" className="scroll-mt-24 border-y border-[#1E2838] py-24 sm:py-28">
      <div className="va-container">
        <SectionHeading
          eyebrow="Interactive lab"
          title="Open the layers. Try the controls."
          description="Four short demos mirror the screens in the identity portal. Switch panels with the local navigation — no scrolling games."
        />

        {/* Arched strip of small buttons that partially encloses the detail panel */}
        <div className="relative mx-auto mt-12 max-w-5xl">
          <div className="relative mx-auto flex h-[150px] w-[min(100%,720px)] items-end justify-around rounded-t-[50%] border border-b-0 border-[#1E2838] bg-gradient-to-b from-[#0E1420] to-[#0E1420]/30 px-4 pb-6 sm:h-[180px] sm:px-10">
            {chambers.map((chamber, index) => {
              const lift = index === 0 || index === 3 ? 12 : 54;
              const shift = index === 0 ? -14 : index === 3 ? 14 : index === 1 ? -6 : 6;
              return (
                <button
                  key={chamber.title}
                  type="button"
                  onClick={() => setActive(index)}
                  aria-pressed={active === index}
                  style={{ transform: `translate(${shift}px, -${lift}px)` }}
                  className="relative flex items-center justify-center rounded-full p-1"
                >
                  <span className="relative flex h-[52px] w-[52px] items-center justify-center rounded-full border border-[#1E2838] bg-[#080C14] sm:h-16 sm:w-16">
                    {active === index ? (
                      <motion.span
                        layoutId="chamber-orbit"
                        transition={{ type: "spring", stiffness: 420, damping: 34 }}
                        className="absolute inset-0 rounded-full bg-[#F07A26]"
                      />
                    ) : null}
                    <span className={`relative z-10 font-mono text-[14px] font-semibold ${active === index ? "va-amber-ink" : "text-[#94A3B8]"}`}>0{index + 1}</span>
                  </span>
                  <span className="sr-only">{chamber.title}</span>
                </button>
              );
            })}
          </div>

          <div className="relative mx-auto -mt-6 w-[min(100%,700px)] rounded-2xl border border-[#1E2838] bg-[#0E1420] p-5 shadow-[0_40px_90px_-55px_rgba(0,0,0,0.95)] sm:p-7">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-[#1E2838] pb-4">
            <div>
              <p className="font-mono text-[11px] text-[#F07A26]">PANEL 0{active + 1} / 04</p>
              <h3 className="mt-1 font-display text-2xl font-bold tracking-[-0.03em] text-white">{chambers[active].title}</h3>
              <p className="mt-0.5 text-[13px] text-[#94A3B8]">{chambers[active].subtitle}</p>
            </div>
            <SeeLive href={chambers[active].route}>{chambers[active].link}</SeeLive>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22 }}
              className=""
            >
              {active === 0 ? (
                <div className="grid gap-6 md:grid-cols-[0.95fr_1.05fr]">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-[#1E2838] pb-2">
                      <span className="text-xs font-semibold text-white">Enterprise sign-in</span>
                      <span className="font-mono text-[10px] text-slate-500">demo shell</span>
                    </div>
                    <div className="rounded-lg border border-[#1E2838] bg-[#080c14] px-3 py-2.5 text-[12px] text-slate-300">{email}</div>
                    <div className="rounded-lg border border-[#1E2838] bg-[#080c14] px-3 transition-colors focus-within:border-[#F07A26] focus-within:ring-1 focus-within:ring-[#F07A26]/40">
                      <input type="password" aria-label="Demo password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full bg-transparent py-2.5 text-[12px] text-white outline-none placeholder:text-[#94A3B8]" />
                    </div>
                    <button type="button" onClick={() => {
                      if (password === "wrong") {
                        const next = strikes + 1;
                        setStrikes(next);
                        setNotice(next >= 3 ? "Account locked for 5 minutes after 3 failed attempts." : `Invalid credentials. Strike ${next} of 3.`);
                      } else {
                        setNotice("Password accepted. A second factor is required before a token is issued.");
                      }
                    }} className="w-full rounded-lg bg-[#F07A26] py-2.5 text-[12px] font-semibold va-amber-ink">Sign in</button>
                    <button type="button" onClick={() => setNotice("FIDO2 / WebAuthn is an architecture concept in this build — no real passkey credential is negotiated.")} className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#1E2838] py-2.5 text-[12px] text-[#94A3B8]">
                      <Fingerprint className="h-4 w-4" /> Continue with passkey
                    </button>
                    {notice ? (
                      <div className={`rounded-lg border p-3 text-[11px] leading-5 ${strikes >= 3 ? "border-red-500/40 bg-red-500/10 text-red-300" : "border-[#1E2838] bg-white/[0.03] text-[#94A3B8]"}`}>{notice}</div>
                    ) : null}
                    <p className="text-[10px] text-slate-600">Type “wrong” to simulate a failed attempt.</p>
                  </div>
                  <div className="space-y-4">
                    <div className="rounded-xl border border-[#1E2838] bg-[#080c14] p-4 font-mono text-[11px]">
                      <p className="border-b border-[#1E2838] pb-2 text-white">Argon2id hash parameters</p>
                      {[["memory", "65536 KB"], ["iterations", "3"], ["parallelism", "4"], ["storage", "PostgreSQL"]].map(([k, v]) => (
                        <div key={k} className="mt-2 flex justify-between"><span className="text-slate-500">{k}</span><span className="text-[#F07A26]">{v}</span></div>
                      ))}
                    </div>
                    <div className="rounded-xl border border-[#1E2838] bg-[#080c14] p-4">
                      <p className="text-[11px] font-semibold text-white">3-strike defense</p>
                      <div className="mt-3 flex gap-2">
                        {[1, 2, 3].map((n) => (
                          <span key={n} className={`flex h-7 w-7 items-center justify-center rounded font-mono text-[11px] ${strikes >= n ? "bg-red-500 text-white" : "bg-white/[0.05] text-slate-600"}`}>{n}</span>
                        ))}
                      </div>
                      <p className="mt-3 text-[10px] leading-4 text-slate-500">Three failed attempts lock the account for exactly five minutes, enforced by an atomic SQL counter.</p>
                    </div>
                  </div>
                </div>
              ) : null}

              {active === 1 ? (
                <div className="grid gap-6 md:grid-cols-[0.9fr_1.1fr]">
                  <div className="rounded-xl border border-[#1E2838] bg-[#080c14] p-6 text-center">
                    <div className="relative mx-auto flex h-28 w-28 items-center justify-center">
                      <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90">
                        <circle cx="50" cy="50" r="44" className="stroke-[#1E2838]" strokeWidth="5" fill="transparent" />
                        <circle cx="50" cy="50" r="44" className="stroke-[#F07A26]" strokeWidth="5" fill="transparent" strokeLinecap="round" strokeDasharray={276.5} strokeDashoffset={276.5 - (276.5 * seconds) / 30} />
                      </svg>
                      <div><p className="font-mono text-2xl font-bold text-white">{seconds}s</p><p className="text-[9px] text-slate-500">REFRESH</p></div>
                    </div>
                    <p className="mt-5 text-sm font-semibold text-white">Email OTP verification</p>
                    <div className="mt-4 flex justify-center gap-2">
                      {otp.split("").map((digit, i) => (
                        <span key={i} className="flex h-11 w-9 items-center justify-center rounded-md border border-[#1E2838] bg-[#0e1420] font-mono text-lg text-white">{digit}</span>
                      ))}
                    </div>
                    <div className="mt-5 flex justify-center gap-2">
                      <button type="button" onClick={() => handleCopy(otp, "otp")} className="inline-flex items-center gap-1.5 rounded-md border border-[#1E2838] px-3 py-2 text-[11px] text-[#94A3B8]">
                        {copyFeedback === "otp" ? <Check className="h-3 w-3 text-[#10B981]" /> : <Copy className="h-3 w-3" />}
                        {copyFeedback === "otp" ? "Copied" : copyFeedback === "failed" ? "Try again" : "Copy code"}
                      </button>
                      <button type="button" onClick={() => setVerified(true)} className="rounded-md bg-[#F07A26] px-4 py-2 text-[11px] font-semibold va-amber-ink">Verify code</button>
                    </div>
                    {verified ? <p className="mt-4 inline-flex items-center gap-1.5 text-[11px] text-[#10B981]"><CheckCircle2 className="h-4 w-4" /> Challenge valid. Session token minted.</p> : null}
                  </div>
                  <div className="space-y-4">
                    <div className="rounded-xl border border-[#1E2838] bg-[#080c14] p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-[12px] font-semibold text-white">Recovery codes</p>
                        <button type="button" onClick={() => setShowRecovery((v) => !v)} className="inline-flex items-center gap-1 text-[11px] text-[#F07A26]">
                          {showRecovery ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}{showRecovery ? "Hide" : "Reveal"}
                        </button>
                      </div>
                      {showRecovery ? (
                        <div className="mt-3 grid grid-cols-2 gap-2 font-mono text-[11px] text-slate-300">
                          {["9F8C-12A7", "3D2E-8B1C", "7A4F-9E2D", "5C1B-4A8E"].map((code) => <span key={code} className="rounded bg-white/[0.04] p-2 text-center">{code}</span>)}
                        </div>
                      ) : <p className="mt-3 text-[11px] text-slate-500">Eight single-use codes are issued when 2FA is enrolled.</p>}
                    </div>
                    <div className="rounded-xl border border-[#1E2838] bg-[#080c14] p-4 text-[11px] leading-6 text-[#94A3B8]">
                      <p className="font-semibold text-white">Why a second factor matters</p>
                      A correct password never creates a session on its own. The portal shows a mandatory email challenge with a ten-minute code validity and a 60-second resend timer.
                    </div>
                  </div>
                </div>
              ) : null}

              {active === 2 ? (
                <div className="space-y-5">
                  <div className="flex items-center justify-between border-b border-[#1E2838] pb-2">
                    <p className="text-xs font-semibold text-white">Active session registry</p>
                    <span className="font-mono text-[10px] text-[#10B981]">{sessions.filter((s) => s.active).length} ACTIVE</span>
                  </div>
                  <div className="space-y-2">
                    {sessions.map((session) => (
                      <div key={session.id} className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3.5 ${session.active ? "border-[#1E2838] bg-[#080c14]" : "border-white/[0.05] bg-white/[0.01] opacity-50"}`}>
                        <div>
                          <p className="text-[12px] font-semibold text-white">{session.device}</p>
                          <p className="font-mono text-[10px] text-slate-500">{session.ip} · {session.active ? "ACTIVE" : "REVOKED"}</p>
                        </div>
                        {session.active ? (
                          <button type="button" onClick={() => revoke(session.id)} className="inline-flex items-center gap-1.5 rounded-md border border-red-500/30 px-2.5 py-1.5 text-[11px] text-red-300 hover:bg-red-500/10">
                            <Trash2 className="h-3 w-3" /> Revoke session
                          </button>
                        ) : <span className="text-[11px] text-slate-500">Revoked</span>}
                      </div>
                    ))}
                  </div>
                  <div className="rounded-lg border border-[#1E2838] bg-[#080c14] p-4 font-mono text-[10px]">
                    <div className="mb-2 flex items-center gap-2 text-white"><Terminal className="h-3.5 w-3.5 text-[#F07A26]" /> Audit stream</div>
                    {logs.map((log, i) => <p key={`${log}-${i}`} className="mt-1 text-slate-500">{log}</p>)}
                  </div>
                  <p className="text-[11px] leading-5 text-[#94A3B8]">
                    The portal states that revoking a session immediately terminates its token in the authentication directory.
                  </p>
                </div>
              ) : null}

              {active === 3 ? (
                <div className="grid gap-6 md:grid-cols-[0.9fr_1.1fr]">
                  <form onSubmit={createClient} className="space-y-3">
                    <p className="border-b border-[#1E2838] pb-2 text-xs font-semibold text-white">Register an OAuth client</p>
                    <div>
                      <label className="text-[11px] text-[#94A3B8]" htmlFor="client-name">Application name</label>
                      <input id="client-name" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Analytics dashboard" className="mt-1 w-full rounded-lg border border-[#1E2838] bg-[#080c14] px-3 py-2.5 text-[12px] text-white outline-none placeholder:text-[#94A3B8] focus:border-[#F07A26] focus:ring-1 focus:ring-[#F07A26]/40" />
                    </div>
                    <div>
                      <label className="text-[11px] text-[#94A3B8]" htmlFor="redirect-uri">Redirect URI</label>
                      <input id="redirect-uri" value={redirectUri} onChange={(e) => setRedirectUri(e.target.value)} className="mt-1 w-full rounded-lg border border-[#1E2838] bg-[#080c14] px-3 py-2.5 font-mono text-[11px] text-white outline-none focus:border-[#F07A26] focus:ring-1 focus:ring-[#F07A26]/40" />
                    </div>
                    <label className="flex items-start gap-2 text-[11px] leading-5 text-[#94A3B8]">
                      <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} className="mt-1 accent-[#F07A26]" />
                      I understand the client secret is shown once and cannot be retrieved again.
                    </label>
                    <button type="submit" disabled={!clientName || !ack} className="inline-flex items-center gap-1.5 rounded-lg bg-[#F07A26] px-4 py-2.5 text-[12px] font-semibold va-amber-ink disabled:opacity-40">
                      <Plus className="h-3.5 w-3.5" /> Register application
                    </button>
                  </form>
                  <div className="space-y-3">
                    <div className="rounded-xl border border-[#1E2838] bg-[#080c14] p-4 font-mono text-[11px]">
                      <p className="text-slate-500">Authorize endpoint</p>
                      <p className="mt-1 break-all text-[#F07A26]">/oauth/authorize?response_type=code&client_id=…&code_challenge_method=S256</p>
                      <p className="mt-3 text-slate-500">Token endpoint</p>
                      <p className="mt-1 break-all text-[#10B981]">POST /oauth/token</p>
                    </div>
                    {secret ? (
                      <div className="rounded-xl border border-[#10B981]/30 bg-[#10B981]/[0.06] p-4">
                        <p className="flex items-center gap-1.5 text-[12px] font-semibold text-[#10B981]"><KeyRound className="h-4 w-4" /> One-time client secret</p>
                        <div className="mt-3 flex items-center gap-2">
                          <code className="min-w-0 flex-1 break-all rounded bg-black/30 p-2 font-mono text-[10px] text-white">{secret}</code>
                          <button type="button" onClick={() => handleCopy(secret, "secret")} className="rounded border border-[#10B981]/30 p-2 text-[#10B981]" aria-label="Copy client secret">
                            {copyFeedback === "secret" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                        <p className="mt-2 text-[10px] text-slate-500">Store it now. VaultAuth does not keep the plaintext value.</p>
                        {copyFeedback === "failed" ? <p className="mt-1 text-[10px] text-red-300">Copy failed — select the secret manually.</p> : null}
                      </div>
                    ) : (
                      <div className="flex items-start gap-2 rounded-xl border border-[#1E2838] bg-[#080c14] p-4 text-[11px] leading-5 text-[#94A3B8]">
                        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#F07A26]" />
                        The admin portal exposes an application registry with client IDs, redirect URIs, allowed scopes, and one-time secret reveal.
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </motion.div>
          </AnimatePresence>

          {active === 0 && strikes >= 3 ? (
            <p className="mt-3 inline-flex items-center gap-2 text-[11px] text-red-300"><AlertTriangle className="h-4 w-4" /> Lockout is enforced by an atomic SQL counter for five minutes.</p>
          ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
