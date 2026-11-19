import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Clock } from "lucide-react";
import { ErrorLayout } from "@/components/layout/ErrorLayout";

export function RateLimitedPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Extract reset unix timestamp or fallback to 60s
  const resetParam = searchParams.get("reset");
  const initialSeconds = resetParam
    ? Math.max(0, Math.floor(parseInt(resetParam, 10) - Date.now() / 1000))
    : 60;

  const [secondsLeft, setSecondsLeft] = useState<number>(initialSeconds || 60);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  const handleRetry = () => {
    navigate(-1);
  };

  return (
    <ErrorLayout
      status={429}
      code="ERR_RATE_LIMITED"
      title="Request Limit Exceeded"
      description="Too many requests were dispatched in a short window. To protect the cryptographic engine and database pool, an atomic cooldown has been triggered."
      extraContent={
        <div className="flex items-center justify-center p-4 rounded-md border border-border bg-muted/30">
          <Clock className="w-5 h-5 text-primary mr-2" />
          <span className="text-sm font-mono text-foreground font-semibold tabular-nums">
            {secondsLeft > 0 ? (
              <span>Retry permitted in {secondsLeft}s</span>
            ) : (
              <span className="text-emerald-500">Cooldown elapsed. Ready to retry.</span>
            )}
          </span>
        </div>
      }
      primaryAction={{
        label: secondsLeft > 0 ? `Wait (${secondsLeft}s)` : "Retry Request",
        onClick: handleRetry,
      }}
      secondaryAction={{
        label: "Return to Sign In",
        href: "/login",
      }}
    />
  );
}
