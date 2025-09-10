"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Home } from "lucide-react";
import { useRouter } from "next/navigation";

interface ChunkErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ChunkErrorBoundaryProps {
  children: React.ReactNode;
}

export class ChunkErrorBoundary extends React.Component<
  ChunkErrorBoundaryProps,
  ChunkErrorBoundaryState
> {
  constructor(props: ChunkErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ChunkErrorBoundaryState {
    // Check if it's a chunk loading error
    if (
      error.message.includes("Loading chunk") ||
      error.message.includes("ChunkLoadError")
    ) {
      return { hasError: true, error };
    }
    return { hasError: false };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Chunk loading error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <ChunkErrorFallback
          onRetry={() => this.setState({ hasError: false })}
        />
      );
    }

    return this.props.children;
  }
}

function ChunkErrorFallback({ onRetry }: { onRetry: () => void }) {
  const router = useRouter();

  const handleRetry = () => {
    // Clear any cached chunks
    if (typeof window !== "undefined") {
      // Clear service worker cache if available
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          registrations.forEach((registration) => {
            registration.unregister();
          });
        });
      }

      // Clear browser cache
      window.location.reload();
    }
    onRetry();
  };

  const handleGoHome = () => {
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6 max-w-md mx-auto p-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Loading Error</h1>
          <p className="text-muted-foreground">
            There was an issue loading the page. This usually happens when the
            app updates.
          </p>
        </div>

        <div className="space-y-3">
          <Button onClick={handleRetry} className="w-full">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Page
          </Button>
          <Button onClick={handleGoHome} variant="outline" className="w-full">
            <Home className="mr-2 h-4 w-4" />
            Go to Dashboard
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          If the problem persists, try clearing your browser cache or contact
          support.
        </p>
      </div>
    </div>
  );
}

export default ChunkErrorBoundary;
