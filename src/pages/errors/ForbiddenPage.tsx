import { ErrorLayout } from "@/components/layout/ErrorLayout";

export function ForbiddenPage() {
  return (
    <ErrorLayout
      status={403}
      code="ERR_FORBIDDEN"
      title="Access Denied"
      description="Administrator privileges are required to view this section. Your current session does not hold the necessary authority."
      primaryAction={{
        label: "Return to My Profile",
        href: "/dashboard/profile",
      }}
      secondaryAction={{
        label: "Sign In as Admin",
        href: "/login",
      }}
    />
  );
}
