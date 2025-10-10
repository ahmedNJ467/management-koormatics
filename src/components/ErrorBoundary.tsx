"use client";

import React, { useState, useEffect, Component, ErrorInfo } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { ErrorDebugger } from "./ErrorDebugger";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ExtendedErrorInfo extends React.ErrorInfo {
  errorBoundary?: string;
  filename?: string;
  message?: string;
  lineno?: number;
  colno?: number;
}

interface ErrorState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ExtendedErrorInfo;
}

class ReactErrorBoundary extends Component<ErrorBoundaryProps, ErrorState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorState {
    console.error("React Error Boundary caught error:", error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("React Error Boundary componentDidCatch:", error, errorInfo);
    this.setState({
      hasError: true,
      error,
      errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
        />
      );
    }

    return this.props.children;
  }
}

function ErrorFallback({
  error,
  errorInfo,
}: {
  error?: Error;
  errorInfo?: ErrorInfo;
}) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Alert className="max-w-md">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Something went wrong</AlertTitle>
        <AlertDescription className="mt-2">
          <p className="text-sm text-muted-foreground mb-4">
            An unexpected error occurred. Please try refreshing the page or
            contact support if the problem persists.
          </p>
          {error && (
            <details className="text-xs text-muted-foreground">
              <summary className="cursor-pointer mb-2">Error details</summary>
              <pre className="bg-muted p-2 rounded overflow-auto">
                {error.toString()}
              </pre>
            </details>
          )}
          <div className="mt-4 flex gap-2">
            <Button
              onClick={() => window.location.reload()}
              variant="default"
              size="sm"
            >
              Refresh Page
            </Button>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              size="sm"
            >
              Try Again
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}

export default function ErrorBoundary({ children }: ErrorBoundaryProps) {
  const [errorState, setErrorState] = useState<ErrorState>({ hasError: false });

  useEffect(() => {
    const handleError = (error: Error | null, errorInfo: React.ErrorInfo) => {
      // More defensive error logging
      if (error) {
        console.error("Error caught by boundary:", error, errorInfo);
      } else {
        console.error("Null error caught by boundary:", errorInfo);
      }

      // Handle null or undefined errors with more context
      let safeError = error;

      if (!safeError) {
        // Create a more meaningful error message
        const errorDetails = {
          componentStack: errorInfo.componentStack,
        };

        safeError = new Error(
          `Unknown error occurred: ${JSON.stringify(errorDetails, null, 2)}`
        );
      }

      setErrorState({
        hasError: true,
        error: safeError,
        errorInfo: errorInfo as ExtendedErrorInfo,
      });
    };

    // Global error handler
    const handleGlobalError = (event: ErrorEvent) => {
      // Prevent infinite loops by checking if the error is from our error boundary
      if (event.filename && event.filename.includes("ErrorBoundary")) {
        console.warn("Ignoring error from ErrorBoundary itself:", event);
        return;
      }

      // Log more details about the error event
      console.error("Global error event details:", {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
        type: event.type,
        bubbles: event.bubbles,
        cancelable: event.cancelable,
      });

      // Handle cases where event.error might be null
      let error: Error | null = event.error;

      // If event.error is null, try to create an error from the event details
      if (!error) {
        const errorMessage =
          event.message ||
          `Error in ${event.filename || "unknown file"}:${
            event.lineno || "unknown line"
          }:${event.colno || "unknown column"}`;
        error = new Error(errorMessage);
        console.warn("Created error from event details:", error);
      }

      handleError(error, {
        componentStack: event.filename || "Unknown",
      } as ExtendedErrorInfo);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error("Unhandled promise rejection:", event);
      const errorMessage = event.reason?.toString() || "Promise rejection";
      handleError(new Error(errorMessage), {
        componentStack: "Promise rejection",
      } as ExtendedErrorInfo);
    };

    try {
      window.addEventListener("error", handleGlobalError);
      window.addEventListener("unhandledrejection", handleUnhandledRejection);
    } catch (error) {
      console.warn("Failed to add error event listeners:", error);
    }

    return () => {
      try {
        window.removeEventListener("error", handleGlobalError);
        window.removeEventListener(
          "unhandledrejection",
          handleUnhandledRejection
        );
      } catch (error) {
        console.warn("Failed to remove error event listeners:", error);
      }
    };
  }, []);

  if (errorState.hasError) {
    return (
      <ErrorFallback
        error={errorState.error}
        errorInfo={errorState.errorInfo}
      />
    );
  }

  return (
    <>
      <ErrorDebugger />
      <ReactErrorBoundary>{children}</ReactErrorBoundary>
    </>
  );
}
