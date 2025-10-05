import { supabase } from "@/integrations/supabase/client";
import { sessionCache } from "./session-cache";

/**
 * Handles authentication errors, particularly refresh token issues
 */
export class AuthErrorHandler {
  private static instance: AuthErrorHandler;
  private isHandling = false;

  static getInstance(): AuthErrorHandler {
    if (!AuthErrorHandler.instance) {
      AuthErrorHandler.instance = new AuthErrorHandler();
    }
    return AuthErrorHandler.instance;
  }

  /**
   * Check if an error is a refresh token error
   */
  isRefreshTokenError(error: any): boolean {
    if (!error?.message) return false;

    const refreshTokenErrors = [
      "Invalid Refresh Token",
      "Refresh Token Not Found",
      "refresh_token_not_found",
      "invalid_grant",
      "Token has expired",
      "JWT expired",
    ];

    return refreshTokenErrors.some((errorType) =>
      error.message.includes(errorType)
    );
  }

  /**
   * Handle refresh token errors by clearing all auth data and redirecting
   */
  async handleRefreshTokenError(error: any): Promise<void> {
    if (this.isHandling) return;

    this.isHandling = true;
    console.warn("Handling refresh token error:", error.message);

    try {
      // Clear session cache
      sessionCache.clearCache();

      // Clear all Supabase auth storage
      await this.clearAuthStorage();

      // Sign out from Supabase (local only to avoid network calls)
      await supabase.auth.signOut({ scope: "local" });

      // Redirect to auth page if not already there
      if (
        typeof window !== "undefined" &&
        window.location.pathname !== "/auth"
      ) {
        window.location.href = "/auth";
      }
    } catch (clearError) {
      console.error("Error during auth cleanup:", clearError);
    } finally {
      this.isHandling = false;
    }
  }

  /**
   * Clear all authentication-related storage
   */
  private async clearAuthStorage(): Promise<void> {
    if (typeof window === "undefined") return;

    try {
      // Get the project reference for storage keys
      const projectRef = supabase.supabaseUrl.split("//")[1].split(".")[0];
      const storageKey = `sb-${projectRef}-auth-token`;

      // Clear localStorage
      localStorage.removeItem(storageKey);
      localStorage.removeItem("supabase.auth.token");

      // Clear sessionStorage
      sessionStorage.removeItem(storageKey);
      sessionStorage.removeItem("supabase.auth.token");

      // Clear any other potential auth keys
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes("supabase") || key.includes("auth"))) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach((key) => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });

      console.log("Auth storage cleared successfully");
    } catch (error) {
      console.error("Failed to clear auth storage:", error);
    }
  }

  /**
   * Handle general authentication errors
   */
  async handleAuthError(error: any): Promise<void> {
    if (this.isRefreshTokenError(error)) {
      await this.handleRefreshTokenError(error);
    } else {
      console.error("Authentication error:", error);
      // For other auth errors, just log them
    }
  }

  /**
   * Reset the handler state (useful for testing)
   */
  reset(): void {
    this.isHandling = false;
  }
}

// Export singleton instance
export const authErrorHandler = AuthErrorHandler.getInstance();

/**
 * Utility function to handle auth errors
 */
export async function handleAuthError(error: any): Promise<void> {
  return authErrorHandler.handleAuthError(error);
}

/**
 * Check if an error is a refresh token error
 */
export function isRefreshTokenError(error: any): boolean {
  return authErrorHandler.isRefreshTokenError(error);
}
