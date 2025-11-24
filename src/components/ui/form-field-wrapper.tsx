"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { FormItem, FormLabel, FormDescription, FormMessage, FormControl } from "@/components/ui/form";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface FormFieldWrapperProps {
  label?: string;
  description?: string;
  required?: boolean;
  error?: string;
  success?: boolean;
  children: React.ReactNode;
  className?: string;
  labelClassName?: string;
  descriptionClassName?: string;
}

/**
 * Enhanced form field wrapper with better visual feedback
 * Provides consistent styling and validation states
 */
export function FormFieldWrapper({
  label,
  description,
  required,
  error,
  success,
  children,
  className,
  labelClassName,
  descriptionClassName,
}: FormFieldWrapperProps) {
  return (
    <FormItem className={cn("space-y-1.5", className)}>
      {label && (
        <FormLabel className={cn("text-sm font-medium", labelClassName)}>
          {label}
          {required && (
            <span className="text-destructive ml-1" aria-label="required">
              *
            </span>
          )}
        </FormLabel>
      )}
      {description && (
        <FormDescription className={cn("text-xs", descriptionClassName)}>
          {description}
        </FormDescription>
      )}
      <FormControl>
        <div className="relative">
          {children}
          {success && !error && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
          )}
        </div>
      </FormControl>
      {error && (
        <div className="flex items-center gap-1.5 text-sm text-destructive">
          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </FormItem>
  );
}

/**
 * Form section wrapper for grouping related fields
 */
interface FormSectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormSection({
  title,
  description,
  children,
  className,
}: FormSectionProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {(title || description) && (
        <div className="space-y-1 border-b border-border pb-3">
          {title && (
            <h3 className="text-base font-semibold text-foreground">{title}</h3>
          )}
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      )}
      <div className="space-y-4">{children}</div>
    </div>
  );
}

/**
 * Form grid layout for responsive form fields
 */
interface FormGridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}

export function FormGrid({
  children,
  columns = 2,
  className,
}: FormGridProps) {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div className={cn("grid gap-4", gridCols[columns], className)}>
      {children}
    </div>
  );
}

