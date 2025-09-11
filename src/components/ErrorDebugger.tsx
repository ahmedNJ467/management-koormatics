import React, { useEffect } from "react";

/**
 * A debugging component that helps identify the source of errors
 * This should only be used in development
 */
export function ErrorDebugger() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") {
      return;
    }

    // Override console.error to catch errors before they reach the error boundary
    const originalConsoleError = console.error;
    console.error = (...args) => {
      console.log("🔍 ErrorDebugger caught console.error:", args);
      originalConsoleError.apply(console, args);
    };

    // Override console.warn to catch warnings
    const originalConsoleWarn = console.warn;
    console.warn = (...args) => {
      console.log("⚠️ ErrorDebugger caught console.warn:", args);
      originalConsoleWarn.apply(console, args);
    };

    // Add a global error handler that logs more details
    const handleError = (event: ErrorEvent) => {
      console.log("🚨 ErrorDebugger caught global error:", {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
        stack: event.error?.stack,
        type: event.type,
        timeStamp: event.timeStamp,
      });
    };

    // Add a global unhandled rejection handler
    const handleRejection = (event: PromiseRejectionEvent) => {
      console.log("🚨 ErrorDebugger caught unhandled rejection:", {
        reason: event.reason,
        promise: event.promise,
        type: event.type,
        timeStamp: event.timeStamp,
      });
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);

    return () => {
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);

  return null; // This component doesn't render anything
}
