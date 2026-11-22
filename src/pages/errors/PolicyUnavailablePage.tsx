import { ErrorLayout } from "@/components/layout/ErrorLayout";
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "react-router-dom";

export function PolicyUnavailablePage() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  const isPrivacy = location.pathname.includes("privacy");
  const docTitle = isPrivacy ? "Privacy Policy" : "Terms of Service";

  return (
    <ErrorLayout
      status={503}
      code="ERR_DOCUMENT_UNAVAILABLE"
      title={`${docTitle} Unavailable`}
      description={`The ${docTitle} is currently undergoing compliance review and is temporarily unavailable. Please check back later or contact your organization's legal administrator.`}
      primaryAction={{
        label: isAuthenticated ? "Back to Dashboard" : "Return to Sign In",
        href: isAuthenticated ? "/dashboard" : "/login",
      }}
    />
  );
}
