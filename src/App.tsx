import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ErrorBoundary } from "@/pages/errors/ErrorBoundary";
import { RequireAuth, RequireAdmin, PublicOnly } from "@/components/layout/RouteGuards";

// Layouts
import { DashboardShell } from "@/components/layout/DashboardShell";

// Auth Pages
import { LoginPage } from "@/pages/auth/LoginPage";
import { RegisterPage } from "@/pages/auth/RegisterPage";
import { VerifyOtpPage } from "@/pages/auth/VerifyOtpPage";

// Dashboard Pages
import { ProfileTab } from "@/pages/dashboard/ProfileTab";
import { SessionsTab } from "@/pages/dashboard/SessionsTab";
import { SettingsTab } from "@/pages/dashboard/SettingsTab";
import { AppsTab } from "@/pages/dashboard/admin/AppsTab";
import { UsersTab } from "@/pages/dashboard/admin/UsersTab";
import { AuditLogsTab } from "@/pages/dashboard/admin/AuditLogsTab";
import { GlobalSessionsTab } from "@/pages/dashboard/admin/GlobalSessionsTab";

// Error Pages
import { ForbiddenPage } from "@/pages/errors/ForbiddenPage";
import { NotFoundPage } from "@/pages/errors/NotFoundPage";
import { RateLimitedPage } from "@/pages/errors/RateLimitedPage";
import { ServerErrorPage } from "@/pages/errors/ServerErrorPage";
import { ServiceUnavailablePage } from "@/pages/errors/ServiceUnavailablePage";
import { PolicyUnavailablePage } from "@/pages/errors/PolicyUnavailablePage";

// The marketing site is the public front door at "/".
import LandingPage from "@landing/App";

function AppRoutes() {
  const { isServiceUnavailable, checkServiceAvailability } = useAuth();
  const [retrying, setRetrying] = useState(false);

  const handleRetry = async () => {
    setRetrying(true);
    try {
      await checkServiceAvailability();
    } finally {
      setRetrying(false);
    }
  };

  // If identity API is unreachable, do not move to login page; show Service Unavailable
  if (isServiceUnavailable) {
    return <ServiceUnavailablePage onRetry={handleRetry} retrying={retrying} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public landing page */}
        <Route path="/" element={<LandingPage />} />

        {/* Public-Only Auth Routes */}
        <Route element={<PublicOnly />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-otp" element={<VerifyOtpPage />} />
        </Route>

        {/* Protected Dashboard Routes */}
        <Route path="/dashboard" element={<RequireAuth />}>
          <Route element={<DashboardShell />}>
            <Route index element={<ProfileTab />} />
            <Route path="profile" element={<ProfileTab />} />
            <Route path="sessions" element={<SessionsTab />} />
            <Route path="settings" element={<SettingsTab />} />

            {/* Admin Only Routes */}
            <Route element={<RequireAdmin />}>
              <Route path="admin/apps" element={<AppsTab />} />
              <Route path="admin/users" element={<UsersTab />} />
              <Route path="admin/audit-logs" element={<AuditLogsTab />} />
              <Route path="admin/sessions" element={<GlobalSessionsTab />} />
            </Route>
          </Route>
        </Route>

        {/* Explicit Error Routes */}
        <Route path="/403" element={<ForbiddenPage />} />
        <Route path="/429" element={<RateLimitedPage />} />
        <Route path="/500" element={<ServerErrorPage />} />

        {/* Legal & Compliance Routes (Temporarily Unavailable) */}
        <Route path="/privacy" element={<PolicyUnavailablePage />} />
        <Route path="/terms" element={<PolicyUnavailablePage />} />

        {/* 404 Catch-All */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
