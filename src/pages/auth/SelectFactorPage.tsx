import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  Loader2,
  Mail,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { api } from "@/lib/api";
import { ApiError } from "@/types/api";
import { useAuth } from "@/context/AuthContext";

const STORAGE_KEY = "vaultauth_pending_factor";

interface PendingFactor {
  email: string;
  password: string;
  methods: string[];
  redirectUrl: string;
}

export function SelectFactorPage() {
  const navigate = useNavigate();
  const { setAuthSession } = useAuth();

  const [pending, setPending] = useState<PendingFactor | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) {
        navigate("/login", { replace: true });
        return;
      }
      const parsed = JSON.parse(raw) as PendingFactor;
      if (!parsed.email || !parsed.password) {
        sessionStorage.removeItem(STORAGE_KEY);
        navigate("/login", { replace: true });
        return;
      }
      setPending(parsed);
    } catch {
      sessionStorage.removeItem(STORAGE_KEY);
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  const handleSelect = async (factor: "email" | "totp") => {
    if (!pending) return;
    setLoading(true);
    setError(null);

    try {
      const res = await api.login({
        email: pending.email,
        password: pending.password,
        factor,
      });
      sessionStorage.removeItem(STORAGE_KEY);

      if (res.state === "OTP_REQUIRED" || res.challenge_id || res.requires_2fa) {
        const challengeParam = res.challenge_id
          ? `&challenge_id=${encodeURIComponent(res.challenge_id)}`
          : "";
        const redirectParam = pending.redirectUrl && pending.redirectUrl !== "/dashboard"
          ? `&redirect=${encodeURIComponent(pending.redirectUrl)}`
          : "";
        const method = factor;
        navigate(
          `/verify-otp?email=${encodeURIComponent(pending.email)}${challengeParam}${redirectParam}&method=${encodeURIComponent(method)}`,
          {
            replace: true,
            state: {
              email: pending.email,
              challengeId: res.challenge_id,
              expiresIn: res.expires_in,
              method,
              isRegistration: false,
              redirectUrl: pending.redirectUrl,
            },
          }
        );
        return;
      }

      if (res.token) {
        api.setToken(res.token);
        const profile = await api.getMe();
        setAuthSession(res.token, profile);
        navigate(pending.redirectUrl, { replace: true });
      }
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      setError(
        apiErr.message ||
          "Unable to start verification for that method. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    navigate("/login", { replace: true });
  };

  const methods = pending?.methods?.length ? pending.methods : ["email"];

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#F1F2F5] px-4 py-8 text-foreground transition-colors duration-150 dark:bg-[#0B0D11]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_45%_at_50%_35%,hsl(var(--primary)/0.06),transparent_70%)]"
      />

      <div className="relative z-10 w-full max-w-[720px] overflow-hidden rounded-none border border-border/70 bg-white shadow-[0_30px_80px_-40px_rgba(16,24,40,0.45)] dark:border-white/[0.07] dark:bg-[#11141A] dark:shadow-[0_30px_80px_-40px_rgba(0,0,0,0.9)] md:grid md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        {/* Always-dark brand panel — same as the sign-in screen */}
        <aside className="relative hidden flex-col justify-between overflow-hidden bg-[#111318] p-7 text-white md:flex">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <div className="absolute -bottom-32 -left-24 h-[380px] w-[380px] rounded-none border border-white/[0.06]" />
            <div className="absolute -bottom-20 -left-12 h-[300px] w-[300px] rounded-full border border-white/[0.05]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_90%,rgba(240,122,38,0.16),transparent_60%)]" />
          </div>

          <div className="relative flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-none bg-[#F07A26] text-white">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <span className="flex items-baseline gap-1.5">
              <span className="font-display text-sm font-bold tracking-tight">VaultAuth</span>
              <span className="font-mono text-[10px] font-semibold tracking-[0.16em] text-white/45">SSO</span>
            </span>
          </div>

          <div className="relative py-8">
            <h2 className="font-display text-[30px] font-bold leading-[1.12] tracking-[-0.035em]">
              One more step.
              <br />
              Then you&rsquo;re in.
            </h2>
            <p className="mt-3 text-[13px] leading-relaxed text-white/55">
              Your password checks out. Choose a second factor to finish signing in.
            </p>

            <ul className="mt-7 space-y-3">
              {["Six-digit challenge", "Single-use code", "Instant revocation"].map((item) => (
                <li key={item} className="flex items-center gap-2.5 text-[13px] text-white/85">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 ring-1 ring-emerald-400/25">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <p className="relative font-mono text-[10px] text-white/35">zero-trust identity gateway</p>
        </aside>

        {/* Themed method panel */}
        <div className="relative flex flex-col">
          <div className="flex flex-1 flex-col justify-center px-6 py-8 sm:px-8">
            <div className="mb-6 md:hidden">
              <span className="flex h-8 w-8 items-center justify-center rounded-none bg-[#F07A26] text-white">
                <ShieldCheck className="h-4 w-4" />
              </span>
            </div>

            <h1 className="font-display text-[26px] font-bold tracking-[-0.03em] text-foreground">
              Choose your second factor
            </h1>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Password confirmed for{" "}
              <span className="font-mono text-[12px] text-foreground">
                {pending?.email || "your account"}
              </span>
              . Pick how you want to verify it&rsquo;s you.
            </p>

            {error && (
              <div className="mt-5 flex items-start gap-2.5 rounded-none border border-destructive/25 bg-destructive/[0.06] p-2.5 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <div className="space-y-0.5">
                  <span className="block font-semibold">Verification error</span>
                  <span className="block leading-relaxed">{error}</span>
                </div>
              </div>
            )}

            <div className="mt-6 space-y-3">
              {methods.includes("email") && (
                <button
                  type="button"
                  onClick={() => handleSelect("email")}
                  disabled={loading || !pending}
                  className="group flex w-full items-center gap-3 rounded-none border border-primary/40 bg-primary/[0.05] p-4 text-left transition-colors hover:bg-primary/[0.09] disabled:opacity-60"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-none bg-[#F07A26] text-white">
                    <Mail className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1 space-y-0.5">
                    <span className="block text-[13px] font-semibold text-foreground">Email OTP</span>
                    <span className="block text-[12px] leading-relaxed text-muted-foreground">
                      A six-digit code delivered to your inbox.
                    </span>
                  </span>
                  {loading ? (
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
                  ) : (
                    <span className="shrink-0 font-mono text-[16px] text-primary">&rarr;</span>
                  )}
                </button>
              )}

              {methods.includes("totp") && (
                <button
                  type="button"
                  onClick={() => handleSelect("totp")}
                  disabled={loading || !pending}
                  className="group flex w-full items-center gap-3 rounded-none border border-border/70 bg-background/50 p-4 text-left transition-colors hover:border-primary/40 disabled:opacity-60"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-none border border-border/70 bg-muted/40 text-muted-foreground">
                    <Smartphone className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1 space-y-0.5">
                    <span className="block text-[13px] font-semibold text-foreground">Authenticator app</span>
                    <span className="block text-[12px] leading-relaxed text-muted-foreground">
                      Enter the current code from your TOTP app.
                    </span>
                  </span>
                  {loading ? (
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
                  ) : (
                    <span className="shrink-0 font-mono text-[16px] text-muted-foreground">&rarr;</span>
                  )}
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={goBack}
              className="mt-6 flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to sign in
            </button>

            <p className="mt-4 text-center text-[12px] text-muted-foreground">
              Need an account?{" "}
              <Link to="/register" className="font-semibold text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground">
                Create an account
              </Link>
            </p>
          </div>

          <div className="flex items-center justify-between border-t border-border/60 px-6 py-3 text-[11px] text-muted-foreground sm:px-8">
            <span>Protected by VaultAuth SSO</span>
            <span className="font-mono">req_8f2c41d9</span>
          </div>
        </div>
      </div>
    </div>
  );
}
