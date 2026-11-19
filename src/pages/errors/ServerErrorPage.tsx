import { useSearchParams } from "react-router-dom";
import { ErrorLayout } from "@/components/layout/ErrorLayout";

export function ServerErrorPage() {
  const [searchParams] = useSearchParams();
  const code = searchParams.get("code") || "ERR_INTERNAL_SERVER";
  const message =
    searchParams.get("message") ||
    "The authentication gateway encountered an unexpected internal exception or the backend service is currently unreachable.";
  const requestId = searchParams.get("req_id") || undefined;

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <ErrorLayout
      status={500}
      code={code}
      title="Service Unavailable"
      description={message}
      requestId={requestId}
      primaryAction={{
        label: "Retry Connection",
        onClick: handleRetry,
      }}
      secondaryAction={{
        label: "Back to Home",
        href: "/",
      }}
    />
  );
}
