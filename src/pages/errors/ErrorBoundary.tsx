import { Component, ErrorInfo, ReactNode } from "react";
import { ErrorLayout } from "@/components/layout/ErrorLayout";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Unhandled VaultAuth runtime error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <ErrorLayout
          status={500}
          code="ERR_CLIENT_CRASH"
          title="Unexpected Application Error"
          description={
            this.state.error?.message ||
            "A client-side runtime exception occurred. The state has been captured safely."
          }
          primaryAction={{
            label: "Reload Application",
            onClick: () => window.location.reload(),
          }}
          secondaryAction={{
            label: "Return to Home",
            href: "/",
          }}
        />
      );
    }

    return this.props.children;
  }
}
