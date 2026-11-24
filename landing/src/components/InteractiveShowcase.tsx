import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import {
  Check,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  Fingerprint,
  KeyRound,
  MousePointer2,
  Plus,
  ShieldCheck,
  Terminal,
  Trash2,
} from "lucide-react";
import { SeeLive } from "./ui/primitives";
import { copyText } from "../lib/clipboard";

const chambers = [
  { title: "Password shield", subtitle: "Argon2id and the three-strike lockout", route: "/dashboard/profile", link: "See lockout policy" },
  { title: "Second factor", subtitle: "A six-digit email challenge", route: "/dashboard/settings", link: "See 2FA settings" },
  { title: "Session kill-switch", subtitle: "Revoke a device on the next request", route: "/dashboard/sessions", link: "See live sessions" },
  { title: "Client registry", subtitle: "Register an OAuth application", route: "/dashboard/admin/apps", link: "See OAuth clients" },
];

const STEP_TIMES = [350, 700, 1050, 1400, 1900, 2400, 2900];
const REVOKE_STAGE = 4;
const PANEL_STARTS = [0, 0.24, 0.48, 0.68];

type PointerProps = {
  stage: number;
  reduce: boolean | null;
  panelRef: RefObject<HTMLDivElement | null>;
  targets: string[];
};

/** Cursor that measures real DOM targets and moves to their centres. */
function DemoPointer({ stage, reduce, panelRef, targets }: PointerProps) {
  const key = targets[Math.min(stage - 1, targets.length - 1)];
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  useLayoutEffect(() => {
    if (!key || !panelRef.current) return;
    const panel = panelRef.current;
    const target = panel.querySelector<HTMLElement>(`[data-pointer="${key}"]`);
    if (!target) return;
    const panelBox = panel.getBoundingClientRect();
    const box = target.getBoundingClientRect();
    setPos({
      x: box.left - panelBox.left + box.width / 2 - 9,
      y: box.top - panelBox.top + box.height / 2 - 9,
    });
  }, [key, panelRef, stage]);

  if (reduce || stage < 1 || !pos) return null;

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none absolute left-0 top-0 z-20 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]"
      initial={{ opacity: 0, x: pos.x, y: pos.y }}
      animate={{ opacity: 1, x: pos.x, y: pos.y }}
      transition={{ type: "spring", stiffness: 520, damping: 34 }}
    >
      <MousePointer2 className="h-5 w-5 -rotate-12 fill-white" />
    </motion.div>
  );
}

export function InteractiveShowcase() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 110, damping: 26, restDelta: 0.001 });
  const railHeight = useTransform(smoothProgress, (value) => `${value * 88}%`);
  const [active, setActive] = useState(0);
  const [engaged, setEngaged] = useState(false);
  const [stage, setStage] = useState(0);
  const [copyFeedback, setCopyFeedback] = useState<boolean | null>(null);
  const [typedPassword, setTypedPassword] = useState("");
  const [seconds, setSeconds] = useState(30);
  const [otpCode, setOtpCode] = useState("482913");
  const [showRecovery, setShowRecovery] = useState(false);

  useMotionValueEvent(smoothProgress, "change", (value) => {
    const next = value >= PANEL_STARTS[3] ? 3 : value >= PANEL_STARTS[2] ? 2 : value >= PANEL_STARTS[1] ? 1 : 0;
    setActive((current) => (current === next ? current : next));
  });

  // Only start a demo once its panel is actually pinned in view.
  useEffect(() => {
    const onScroll = () => {
      const top = sectionRef.current?.getBoundingClientRect().top ?? 9999;
      setEngaged(top <= 1);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Each chamber plays its own sequence once, then holds still.
  useEffect(() => {
    setTypedPassword("");
    setShowRecovery(false);
    setSeconds(30);
    setOtpCode("482913");

    if (!engaged) {
      setStage(0);
      return;
    }
    if (reduce) {
      setStage(7);
      return;
    }
    setStage(0);
    const timers = STEP_TIMES.map((time, index) =>
      window.setTimeout(() => setStage(index + 1), time)
    );

    let typeTimer: number | undefined;
    if (active === 0) {
      const full = "Password12345!";
      let index = 0;
      typeTimer = window.setInterval(() => {
        index += 1;
        setTypedPassword(full.slice(0, index));
        if (index >= full.length && typeTimer) window.clearInterval(typeTimer);
      }, 40);
    }

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      if (typeTimer) window.clearInterval(typeTimer);
    };
  }, [active, engaged, reduce]);

  // Real countdown for the OTP panel, independent of the scroll stage.
  useEffect(() => {
    if (active !== 1 || !engaged || reduce) return;
    const timer = window.setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [active, engaged, reduce]);

  useEffect(() => {
    if (active !== 1 || seconds > 0) return;
    setOtpCode(String(Math.floor(100000 + Math.random() * 900000)));
    setSeconds(30);
  }, [active, seconds]);

  const copy = async (text: string) => {
    const ok = await copyText(text);
    setCopyFeedback(ok);
    window.setTimeout(() => setCopyFeedback(null), 1600);
  };

  // Chamber values derived from the current stage.
  const password = typedPassword;
  const signedIn = stage >= 4;
  const clickPulse = stage >= 3;

  const otp = otpCode;
  const shownDigits = Math.min(6, Math.max(0, stage));
  const verified = stage >= 7;
  const otpClick = stage >= 7;

  const sessionStates = [
    { active: true },
    { active: stage < REVOKE_STAGE },
  ];
  const auditLines = [
    ...(stage >= REVOKE_STAGE ? ["11:03  SESSION_REVOKED  49.207.44.12"] : []),
    "11:01  AUTH_SUCCESS  103.24.18.9",
  ];

  const clientName = stage >= 1 ? "Analytics Dashboard" : "";
  const redirectUri = stage >= 2 ? "http://localhost:3000/callback" : "";
  const ack = stage >= 3;
  const secret = stage >= 4 ? "va_secret_7f3a91c4e8b2d0a6f15c" : null;

  const pointerTargets =
    active === 0
      ? ["login-password", "login-password", "login-submit", "login-submit", "login-done", "login-done", "login-done"]
      : active === 1
        ? ["otp-digit-0", "otp-digit-1", "otp-digit-2", "otp-digit-3", "otp-digit-4", "otp-digit-5", "otp-submit"]
        : active === 2
          ? ["revoke-1", "revoke-1", "revoke-1", "revoke-1", "audit-stream", "audit-stream", "audit-stream"]
          : [];

  const enter = (delay: number) => ({
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.35, delay, ease: [0.22, 1, 0.36, 1] as const },
  });

  return (
    <section id="showcase" ref={sectionRef} className="relative border-y border-[#1E2838]">
      <div className="h-[380vh]">
        <div className="sticky top-0 flex min-h-screen items-center overflow-hidden py-14">
          <div className="va-grid pointer-events-none absolute inset-0 opacity-[0.08]" />
          <div className="va-container relative grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
            {/* Scroll rail */}
            <div className="hidden lg:block">
              <p className="mb-6 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#F07A26]">Security walkthrough</p>
              <div className="relative pl-8">
                <div className="absolute bottom-2 left-[7px] top-2 w-px bg-[#1E2838]" />
                <motion.div
                  className="absolute left-[7px] top-2 w-px bg-[#F07A26] shadow-[0_0_10px_rgba(246,122,38,0.8)]"
                  style={{ height: railHeight }}
                />
                {chambers.map((chamber, index) => (
                  <button
                    key={chamber.title}
                    type="button"
                    onClick={() => {
                      const top = sectionRef.current?.offsetTop ?? 0;
                      const height = sectionRef.current?.offsetHeight ?? 0;
                      window.scrollTo({ top: top + (height - window.innerHeight) * (PANEL_STARTS[index] + 0.02), behavior: "smooth" });
                    }}
                    className={`relative mb-8 block w-full text-left transition-opacity ${active === index ? "opacity-100" : "opacity-45 hover:opacity-80"}`}
                  >
                    <span className={`absolute -left-8 top-1.5 h-[15px] w-[15px] rounded-full border-2 ${active >= index ? "border-[#F07A26] bg-[#F07A26]" : "border-[#334155] bg-[#080C14]"}`} />
                    <span className="block font-mono text-[10px] text-[#F07A26]">0{index + 1}</span>
                    <span className="mt-1 block text-[13px] font-semibold text-white">{chamber.title}</span>
                    <span className="mt-0.5 block text-[11px] leading-4 text-[#94A3B8]">{chamber.subtitle}</span>
                  </button>
                ))}
              </div>
              <p className="mt-4 font-mono text-[10px] text-[#94A3B8]">{Math.round(smoothProgress.get() * 100)}% scrolled</p>
            </div>

            {/* Panel */}
            <div className="mx-auto w-full max-w-5xl">
              <AnimatePresence mode="wait">
                <motion.div
                  key={active}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -14 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-mono text-[11px] text-[#F07A26]">PANEL 0{active + 1} / 04</p>
                      <h3 className="mt-1 font-display text-2xl font-bold tracking-[-0.03em] text-white sm:text-3xl">{chambers[active]?.title}</h3>
                      <p className="mt-0.5 text-[13px] text-[#94A3B8]">{chambers[active]?.subtitle}</p>
                    </div>
                    <SeeLive href={chambers[active]?.route || "#"}>{chambers[active]?.link}</SeeLive>
                  </div>

                  <div ref={panelRef} className="relative rounded-2xl border border-[#1E2838] bg-[#0E1420] p-5 shadow-[0_40px_90px_-55px_rgba(0,0,0,0.95)] sm:p-7">
                    {active === 0 ? (
                      <div className="grid gap-6 md:grid-cols-[0.95fr_1.05fr]">
                        <div className="relative min-h-[240px]">
                          <AnimatePresence mode="wait">
                            {!signedIn ? (
                              <motion.div
                                key="login-form"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.22 }}
                                className="space-y-3"
                              >
                                <div className="flex items-center justify-between border-b border-[#1E2838] pb-2">
                                  <span className="text-xs font-semibold text-white">Enterprise sign-in</span>
                                  <span className="font-mono text-[10px] text-[#94A3B8]">demo shell</span>
                                </div>
                                <div className="rounded-lg border border-[#1E2838] bg-[#080c14] px-3 py-2.5 text-[12px] text-slate-300">shaurya@example.com</div>
                                <div className="rounded-lg border border-[#1E2838] bg-[#080c14] px-3 transition-colors focus-within:border-[#F07A26]">
                                  <input
                                    readOnly
                                    type="password"
                                    value={password}
                                    aria-label="Demo password"
                                    data-pointer="login-password"
                                    placeholder="Password"
                                    className="w-full bg-transparent py-2.5 font-mono text-[12px] tracking-[0.18em] text-white outline-none placeholder:tracking-normal placeholder:text-[#94A3B8]"
                                  />
                                </div>
                                <motion.button
                                  type="button"
                                  data-pointer="login-submit"
                                  animate={clickPulse ? { scale: [1, 0.96, 1] } : { scale: 1 }}
                                  transition={{ duration: 0.2 }}
                                  className="relative w-full rounded-lg bg-[#F07A26] py-2.5 text-[12px] font-semibold va-amber-ink"
                                >
                                  {clickPulse ? (
                                    <motion.span
                                      aria-hidden="true"
                                      className="pointer-events-none absolute inset-0 border border-[#F07A26]"
                                      initial={{ opacity: 0.9, scale: 1 }}
                                      animate={{ opacity: 0, scale: 1.12 }}
                                      transition={{ duration: 0.55 }}
                                    />
                                  ) : null}
                                  Sign in
                                </motion.button>
                                <div className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#1E2838] py-2.5 text-[12px] text-[#94A3B8]">
                                  <Fingerprint className="h-4 w-4" /> Continue with passkey
                                </div>
                              </motion.div>
                            ) : (
                              <motion.div
                                key="login-done"
                                data-pointer="login-done"
                                initial={{ opacity: 0, scale: 0.94 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.3 }}
                                className="flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-lg border border-[#10B981]/30 bg-[#10B981]/[0.06] p-6 text-center"
                              >
                                <svg viewBox="0 0 64 64" className="h-14 w-14">
                                  <motion.circle
                                    cx="32" cy="32" r="27"
                                    className="stroke-[#10B981]"
                                    strokeWidth="3" fill="transparent"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 0.5, ease: "easeOut" }}
                                  />
                                  <motion.path
                                    d="M21 33l8 8 15-16"
                                    className="stroke-[#10B981]"
                                    strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="transparent"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 0.4, delay: 0.45, ease: "easeOut" }}
                                  />
                                </svg>
                                <p className="font-display text-lg font-semibold text-white">Signed in</p>
                                <p className="text-[11px] text-[#94A3B8]">Opaque session token issued after Argon2id verification.</p>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        <div className="space-y-4">
                          <motion.div {...enter(0.15)} className="rounded-xl border border-[#1E2838] bg-[#080c14] p-4 font-mono text-[11px]">
                            <p className="border-b border-[#1E2838] pb-2 text-white">Argon2id hash parameters</p>
                            {[["memory", "65536 KB"], ["iterations", "3"], ["parallelism", "4"], ["storage", "PostgreSQL"]].map(([k, v], i) => (
                              <motion.div key={k} {...enter(0.25 + i * 0.08)} className="mt-2 flex justify-between"><span className="text-[#94A3B8]">{k}</span><span className="text-[#F07A26]">{v}</span></motion.div>
                            ))}
                          </motion.div>
                          <motion.div {...enter(0.5)} className="rounded-xl border border-[#1E2838] bg-[#080c14] p-4">
                            <p className="text-[11px] font-semibold text-white">3-strike defense</p>
                            <div className="mt-3 flex gap-2">
                              {[1, 2, 3].map((n) => (
                                <span key={n} className="flex h-7 w-7 items-center justify-center rounded bg-white/[0.05] font-mono text-[11px] text-[#94A3B8]">{n}</span>
                              ))}
                            </div>
                            <p className="mt-3 text-[10px] leading-4 text-[#94A3B8]">Three failures lock the account for exactly five minutes.</p>
                          </motion.div>
                        </div>
                      </div>
                    ) : null}

                    {active === 1 ? (
                      <div className="grid gap-6 md:grid-cols-[0.9fr_1.1fr]">
                        <motion.div {...enter(0)} className="flex flex-col items-center gap-4 rounded-xl border border-[#1E2838] bg-[#080c14] p-6 text-center">
                          <div className="relative flex h-28 w-28 items-center justify-center">
                            <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90">
                              <circle cx="50" cy="50" r="44" className="stroke-[#1E2838]" strokeWidth="5" fill="transparent" />
                              <motion.circle cx="50" cy="50" r="44" className="stroke-[#F07A26]" strokeWidth="5" fill="transparent" strokeLinecap="round" strokeDasharray={276.5} animate={{ strokeDashoffset: 276.5 - (276.5 * seconds) / 30 }} transition={{ duration: 0.8 }} />
                            </svg>
                            <div><p className="font-mono text-2xl font-bold text-white">{seconds}s</p><p className="text-[9px] text-[#94A3B8]">VALIDITY</p></div>
                          </div>
                          <p className="text-sm font-semibold text-white">Email OTP verification</p>
                          <div className="flex justify-center gap-2">
                            {otp.split("").map((digit, i) => (
                              <motion.span key={i} data-pointer={`otp-digit-${i}`} initial={{ opacity: 0, y: 6 }} animate={i < shownDigits ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.3, delay: i * 0.12 }} className="flex h-11 w-9 items-center justify-center rounded-md border border-[#1E2838] bg-[#0e1420] font-mono text-lg text-white">
                                {i < shownDigits ? digit : "·"}
                              </motion.span>
                            ))}
                          </div>
                          <motion.button
                            type="button"
                            data-pointer="otp-submit"
                            animate={otpClick ? { scale: [1, 0.96, 1] } : { scale: 1 }}
                            transition={{ duration: 0.2 }}
                            className="relative rounded-lg bg-[#F07A26] px-5 py-2 text-[11px] font-semibold va-amber-ink"
                          >
                            {otpClick ? (
                              <motion.span
                                aria-hidden="true"
                                className="pointer-events-none absolute inset-0 border border-[#F07A26]"
                                initial={{ opacity: 0.9, scale: 1 }}
                                animate={{ opacity: 0, scale: 1.12 }}
                                transition={{ duration: 0.55 }}
                              />
                            ) : null}
                            Verify and sign in
                          </motion.button>
                          <AnimatePresence>
                            {verified ? (
                              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="inline-flex items-center gap-1.5 text-[11px] text-[#10B981]"><CheckCircle2 className="h-4 w-4" /> Sign in successful</motion.p>
                            ) : null}
                          </AnimatePresence>
                        </motion.div>

                        <div className="space-y-4">
                          <motion.div {...enter(0.15)} className="rounded-xl border border-[#1E2838] bg-[#080c14] p-4">
                            <div className="flex items-center justify-between">
                              <p className="text-[12px] font-semibold text-white">Recovery codes</p>
                              <button
                                type="button"
                                onClick={() => setShowRecovery((value) => !value)}
                                className="inline-flex items-center gap-1 text-[11px] text-[#F07A26] hover:underline"
                              >
                                {showRecovery ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                {showRecovery ? "Visible" : "Hidden"}
                              </button>
                            </div>
                            <div className="mt-3 grid grid-cols-2 gap-2 font-mono text-[11px] text-slate-300">
                              {(showRecovery ? ["9F8C-12A7", "3D2E-8B1C", "7A4F-9E2D", "5C1B-4A8E"] : ["••••-••••", "••••-••••", "••••-••••", "••••-••••"]).map((code, i) => <span key={i} className="rounded bg-white/[0.04] p-2 text-center">{code}</span>)}
                            </div>
                          </motion.div>
                          <motion.div {...enter(0.4)} className="rounded-xl border border-[#1E2838] bg-[#080c14] p-4 text-[11px] leading-6 text-[#94A3B8]">
                            <p className="font-semibold text-white">Why a second factor matters</p>
                            A valid password never creates a session on its own. The backend mints an opaque token only after the six-digit code is verified.
                          </motion.div>
                        </div>
                      </div>
                    ) : null}

                    {active === 2 ? (
                      <div className="relative space-y-4">
                        <motion.div {...enter(0)} className="flex items-center justify-between border-b border-[#1E2838] pb-2">
                          <p className="text-xs font-semibold text-white">Active session registry</p>
                          <span className="font-mono text-[10px] text-[#10B981]">{sessionStates.filter((s) => s.active).length} ACTIVE</span>
                        </motion.div>
                        <div className="space-y-2">
                          {[
                            { device: "Safari · macOS", ip: "103.24.18.9" },
                            { device: "Chrome · Windows", ip: "49.207.44.12" },
                          ].map((session, i) => (
                            <motion.div
                              key={session.device}
                              layout
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: sessionStates[i]?.active ? 1 : 0.45, y: 0 }}
                              transition={{ duration: 0.3, delay: 0.1 + i * 0.1 }}
                              className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3.5 ${sessionStates[i]?.active ? "border-[#1E2838] bg-[#080c14]" : "border-red-500/20 bg-red-500/[0.04]"}`}
                            >
                              <div>
                                <p className="text-[12px] font-semibold text-white">{session.device}</p>
                                <p className="font-mono text-[10px] text-[#94A3B8]">{session.ip} · {sessionStates[i]?.active ? "ACTIVE" : "REVOKED"}</p>
                              </div>
                              {sessionStates[i]?.active ? (
                                <motion.span
                                  data-pointer={`revoke-${i}`}
                                  animate={i === 1 && stage === REVOKE_STAGE ? { scale: [1, 0.88, 1] } : { scale: 1 }}
                                  transition={{ duration: 0.2 }}
                                  className="inline-flex items-center gap-1.5 rounded-md border border-red-500/30 px-2.5 py-1.5 text-[11px] text-red-300"
                                >
                                  <Trash2 className="h-3 w-3" /> Revoke
                                </motion.span>
                              ) : (
                                <motion.span initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="rounded-md border border-red-500/30 bg-red-500/10 px-2 py-1 font-mono text-[10px] text-red-300">REVOKED</motion.span>
                              )}
                            </motion.div>
                          ))}
                        </div>
                        <motion.div {...enter(0.6)} data-pointer="audit-stream" className="rounded-lg border border-[#1E2838] bg-[#080c14] p-4 font-mono text-[10px]">
                          <div className="mb-2 flex items-center gap-2 text-white"><Terminal className="h-3.5 w-3.5 text-[#F07A26]" /> Audit stream <span className="ml-auto inline-flex items-center gap-1 text-[9px] text-[#10B981]"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#10B981]" /> LIVE</span></div>
                          {auditLines.map((line, i) => <motion.p key={line} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 + i * 0.2 }} className="mt-1 text-[#94A3B8]">{line}</motion.p>)}
                        </motion.div>
                      </div>
                    ) : null}

                    {active === 3 ? (
                      <div className="grid gap-6 md:grid-cols-[0.9fr_1.1fr]">
                        <div className="relative space-y-3">
                          <motion.p {...enter(0)} className="border-b border-[#1E2838] pb-2 text-xs font-semibold text-white">Register an OAuth client</motion.p>
                          <motion.div {...enter(0.15)}>
                            <label className="text-[11px] text-[#94A3B8]" htmlFor="demo-client-name">Application name</label>
                            <input id="demo-client-name" readOnly value={clientName} placeholder="Analytics dashboard" className="mt-1 w-full rounded-lg border border-[#1E2838] bg-[#080c14] px-3 py-2.5 text-[12px] text-white outline-none placeholder:text-[#94A3B8]" />
                          </motion.div>
                          <motion.div {...enter(0.3)}>
                            <label className="text-[11px] text-[#94A3B8]" htmlFor="demo-redirect">Redirect URI</label>
                            <input id="demo-redirect" readOnly value={redirectUri} placeholder="http://localhost:3000/callback" className="mt-1 w-full rounded-lg border border-[#1E2838] bg-[#080c14] px-3 py-2.5 font-mono text-[11px] text-white outline-none placeholder:text-[#94A3B8]" />
                          </motion.div>
                          <motion.label {...enter(0.45)} className="flex items-start gap-2 text-[11px] leading-5 text-[#94A3B8]">
                            <input type="checkbox" readOnly checked={ack} className="mt-1 accent-[#F07A26]" />
                            I understand the secret is shown once.
                          </motion.label>
                          <motion.button {...enter(0.6)} type="button" className="inline-flex items-center gap-1.5 rounded-lg bg-[#F07A26] px-4 py-2.5 text-[12px] font-semibold va-amber-ink">
                            <Plus className="h-3.5 w-3.5" /> Register application
                          </motion.button>
                        </div>
                        <div className="space-y-3">
                          <motion.div {...enter(0.2)} className="rounded-xl border border-[#1E2838] bg-[#080c14] p-4 font-mono text-[11px]">
                            <p className="text-[#94A3B8]">Authorize endpoint</p>
                            <p className="mt-1 break-all text-[#F07A26]">/oauth/authorize?response_type=code&code_challenge_method=S256</p>
                            <p className="mt-3 text-[#94A3B8]">Token endpoint</p>
                            <p className="mt-1 break-all text-[#10B981]">POST /oauth/token</p>
                          </motion.div>
                          <AnimatePresence>
                            {secret ? (
                              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-[#10B981]/30 bg-[#10B981]/[0.06] p-4">
                                <p className="flex items-center gap-1.5 text-[12px] font-semibold text-[#10B981]"><KeyRound className="h-4 w-4" /> One-time client secret</p>
                                <div className="mt-3 flex items-center gap-2">
                                  <code className="min-w-0 flex-1 break-all rounded bg-black/30 p-2 font-mono text-[10px] text-white">{secret}</code>
                                  <button type="button" onClick={() => copy(secret)} className="rounded border border-[#10B981]/30 p-2 text-[#10B981]" aria-label="Copy client secret">
                                    {copyFeedback ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                                  </button>
                                </div>
                              </motion.div>
                            ) : (
                              <motion.div {...enter(0.5)} className="flex items-start gap-2 rounded-xl border border-[#1E2838] bg-[#080c14] p-4 text-[11px] leading-5 text-[#94A3B8]">
                                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#F07A26]" />
                                The admin portal exposes an application registry with one-time secret reveal.
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    ) : null}

                    {active !== 3 ? (
                      <DemoPointer
                        stage={stage}
                        reduce={reduce}
                        panelRef={panelRef}
                        targets={pointerTargets}
                      />
                    ) : null}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
