import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
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
import { AppsTab } from "@/pages/dashboard/admin/AppsTab";
import { UsersTab } from "@/pages/dashboard/admin/UsersTab";
import { AuditLogsTab } from "@/pages/dashboard/admin/AuditLogsTab";
import { GlobalSessionsTab } from "@/pages/dashboard/admin/GlobalSessionsTab";

// Error Pages
import { ForbiddenPage } from "@/pages/errors/ForbiddenPage";
import { NotFoundPage } from "@/pages/errors/NotFoundPage";
import { RateLimitedPage } from "@/pages/errors/RateLimitedPage";
import { ServerErrorPage } from "@/pages/errors/ServerErrorPage";

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Root redirect */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />

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

              {/* 404 Catch-All */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
