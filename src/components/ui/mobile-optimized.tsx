"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-responsive";

/**
 * Component that renders differently on mobile vs desktop
 */
interface ResponsiveProps {
  mobile: React.ReactNode;
  desktop: React.ReactNode;
  className?: string;
}

export function Responsive({ mobile, desktop, className }: ResponsiveProps) {
  const isMobile = useIsMobile();
  return (
    <div className={className}>
      {isMobile ? mobile : desktop}
    </div>
  );
}

/**
 * Hide component on mobile
 */
export function HideOnMobile({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("hidden md:block", className)}>{children}</div>;
}

/**
 * Show component only on mobile
 */
export function ShowOnMobile({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("block md:hidden", className)}>{children}</div>;
}

/**
 * Mobile-optimized container with proper padding
 */
export function MobileContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "w-full px-4 sm:px-6 lg:px-8",
        "max-w-7xl mx-auto",
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Mobile-optimized card with responsive padding
 */
export function MobileCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-4 sm:p-6",
        "shadow-sm",
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Touch-friendly button wrapper
 * Ensures minimum touch target size (44x44px)
 */
export function TouchTarget({
  children,
  className,
  as: Component = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}) {
  return (
    <Component
      className={cn(
        "min-h-[44px] min-w-[44px]",
        "flex items-center justify-center",
        className
      )}
    >
      {children}
    </Component>
  );
}

