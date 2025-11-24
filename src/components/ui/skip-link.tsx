"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Skip to main content link for accessibility
 * Allows keyboard users to skip navigation and go directly to main content
 */
export function SkipLink({ href = "#main-content", className }: { href?: string; className?: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50",
        "focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground",
        "focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
        "transition-all duration-200",
        className
      )}
    >
      Skip to main content
    </Link>
  );
}

