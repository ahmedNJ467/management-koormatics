'use client'

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export default function ErrorBoundary({ children }: ErrorBoundaryProps) {
  const [errorState, setErrorState] = useState<ErrorState>({ hasError: false });

  useEffect(() => {
    const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
      console.error("Error caught by boundary:", error, errorInfo);
      setErrorState({
        hasError: true,
        error,
        errorInfo,
      });
    };

    // Global error handler
    const handleGlobalError = (event: ErrorEvent) => {
      handleError(event.error, { componentStack: event.filename || 'Unknown' });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      handleError(new Error(event.reason), { componentStack: 'Promise rejection' });
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  if (errorState.hasError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Alert className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription className="mt-2">
            <p className="text-sm text-muted-foreground mb-4">
              An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.
            </p>
            {errorState.error && (
              <details className="text-xs text-muted-foreground">
                <summary className="cursor-pointer mb-2">Error details</summary>
                <pre className="bg-muted p-2 rounded overflow-auto">
                  {errorState.error.toString()}
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
                onClick={() => setErrorState({ hasError: false })}
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

  return <>{children}</>;
}
