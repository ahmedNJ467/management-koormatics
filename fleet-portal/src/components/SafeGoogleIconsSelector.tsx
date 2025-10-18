import React from "react";
import { GoogleIconsSelector } from "./ui/google-icons-selector";

interface SafeGoogleIconsSelectorProps {
  value?: string;
  onChange: (iconName: string) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * A wrapper around GoogleIconsSelector with additional error handling
 * to prevent crashes from propagating to the ErrorBoundary
 */
export function SafeGoogleIconsSelector(props: SafeGoogleIconsSelectorProps) {
  try {
    return <GoogleIconsSelector {...props} />;
  } catch (error) {
    console.error("Error in SafeGoogleIconsSelector:", error);

    // Fallback UI
    return (
      <div className={`space-y-2 ${props.className || ""}`}>
        <label className="text-sm font-medium">Icon</label>
        <div className="flex items-center gap-2 p-2 border rounded-md bg-gray-50">
          <div className="h-6 w-6 bg-gray-300 rounded flex items-center justify-center">
            <span className="text-xs">⚠️</span>
          </div>
          <span className="text-sm text-gray-600">
            Icon selector temporarily unavailable
          </span>
        </div>
        <p className="text-xs text-gray-500">
          Please refresh the page to restore functionality
        </p>
      </div>
    );
  }
}
