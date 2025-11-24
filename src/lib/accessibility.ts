/**
 * Accessibility utilities and helpers
 */

/**
 * Generate ARIA label for form fields
 */
export function getAriaLabel(
  label: string,
  required?: boolean,
  error?: string
): string {
  let ariaLabel = label;
  if (required) {
    ariaLabel += ", required";
  }
  if (error) {
    ariaLabel += `, error: ${error}`;
  }
  return ariaLabel;
}

/**
 * Generate ARIA described by IDs
 */
export function getAriaDescribedBy(
  descriptionId?: string,
  errorId?: string,
  hasError?: boolean
): string | undefined {
  const ids: string[] = [];
  if (descriptionId) ids.push(descriptionId);
  if (hasError && errorId) ids.push(errorId);
  return ids.length > 0 ? ids.join(" ") : undefined;
}

/**
 * Keyboard event handlers for accessibility
 */
export const keyboardHandlers = {
  /**
   * Handle Enter key to trigger action
   */
  onEnter: (handler: () => void) => (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handler();
    }
  },

  /**
   * Handle Escape key to close/cancel
   */
  onEscape: (handler: () => void) => (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      handler();
    }
  },

  /**
   * Handle Arrow keys for navigation
   */
  onArrowKeys: (
    onUp?: () => void,
    onDown?: () => void,
    onLeft?: () => void,
    onRight?: () => void
  ) => (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowUp":
        e.preventDefault();
        onUp?.();
        break;
      case "ArrowDown":
        e.preventDefault();
        onDown?.();
        break;
      case "ArrowLeft":
        e.preventDefault();
        onLeft?.();
        break;
      case "ArrowRight":
        e.preventDefault();
        onRight?.();
        break;
    }
  },
};

/**
 * Focus management utilities
 */
export const focusManagement = {
  /**
   * Trap focus within an element
   */
  trapFocus: (element: HTMLElement) => {
    const focusableElements = element.querySelectorAll(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    element.addEventListener("keydown", handleTab);
    firstElement?.focus();

    return () => {
      element.removeEventListener("keydown", handleTab);
    };
  },

  /**
   * Return focus to previous element
   */
  returnFocus: (previousElement: HTMLElement | null) => {
    if (previousElement && typeof previousElement.focus === "function") {
      previousElement.focus();
    }
  },
};

/**
 * Screen reader announcements
 */
export function announceToScreenReader(message: string, priority: "polite" | "assertive" = "polite") {
  const announcement = document.createElement("div");
  announcement.setAttribute("role", "status");
  announcement.setAttribute("aria-live", priority);
  announcement.setAttribute("aria-atomic", "true");
  announcement.className = "sr-only";
  announcement.textContent = message;

  document.body.appendChild(announcement);

  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

