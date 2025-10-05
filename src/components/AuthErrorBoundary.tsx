import React, { Component, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, LogIn } from "lucide-react";
import { handleAuthError } from "@/lib/auth-error-handler";

interface AuthErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface AuthErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  isHandling: boolean;
}

export class AuthErrorBoundary extends Component<
  AuthErrorBoundaryProps,
  AuthErrorBoundaryState
> {
  constructor(props: AuthErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      isHandling: false,
    };
  }

  static getDerivedStateFromError(error: Error): AuthErrorBoundaryState {
    // Check if this is an auth-related error
    const isAuthError =
      error.message.includes("Invalid Refresh Token") ||
      error.message.includes("Refresh Token Not Found") ||
      error.message.includes("refresh_token_not_found") ||
      error.message.includes("invalid_grant") ||
      error.message.includes("Token has expired") ||
      error.message.includes("JWT expired");

    return {
      hasError: isAuthError,
      error,
      isHandling: false,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("AuthErrorBoundary caught an error:", error, errorInfo);

    // Handle refresh token errors
    if (this.state.hasError) {
      this.handleAuthError(error);
    }
  }

  private async handleAuthError(error: Error) {
    if (this.state.isHandling) return;

    this.setState({ isHandling: true });

    try {
      await handleAuthError(error);
    } catch (handleError) {
      console.error("Error handling auth error:", handleError);
    } finally {
      this.setState({ isHandling: false });
    }
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      isHandling: false,
    });
  };

  private handleGoToAuth = () => {
    window.location.href = "/auth";
  };

  private handleRefresh = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center space-y-6 max-w-md mx-auto p-6">
            <div className="space-y-2">
              <div className="flex justify-center">
                <AlertTriangle className="h-12 w-12 text-destructive" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">
                Authentication Error
              </h1>
              <p className="text-muted-foreground">
                Your session has expired or there was an authentication issue.
                Please sign in again to continue.
              </p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={this.handleGoToAuth}
                className="w-full"
                disabled={this.state.isHandling}
              >
                <LogIn className="mr-2 h-4 w-4" />
                {this.state.isHandling ? "Redirecting..." : "Sign In"}
              </Button>

              <Button
                onClick={this.handleRefresh}
                variant="outline"
                className="w-full"
                disabled={this.state.isHandling}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Page
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              If the problem persists, try clearing your browser cache or
              contact support.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AuthErrorBoundary;
