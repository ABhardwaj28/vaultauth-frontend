import { ErrorLayout } from "@/components/layout/ErrorLayout";
import { useAuth } from "@/context/AuthContext";

export function NotFoundPage() {
  const { isAuthenticated } = useAuth();

  return (
    <ErrorLayout
      status={404}
      code="ERR_NOT_FOUND"
      title="Page Not Found"
      description="The requested identity resource or dashboard endpoint does not exist or has been relocated."
      primaryAction={{
        label: isAuthenticated ? "Back to Dashboard" : "Return to Sign In",
        href: isAuthenticated ? "/dashboard" : "/login",
      }}
    />
  );
}
