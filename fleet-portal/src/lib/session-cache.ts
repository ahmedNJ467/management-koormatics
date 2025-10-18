/**
 * Session cache utility to reduce redundant Supabase session calls
 * and improve login performance
 */

import { handleAuthError } from "./auth-error-handler";

interface CachedSession {
  session: any;
  timestamp: number;
  expiresAt: number;
}

class SessionCache {
  private cache: CachedSession | null = null;
  private readonly CACHE_DURATION = 10 * 1000; // 10 seconds (much shorter)
  private readonly MAX_AGE = 2 * 60 * 1000; // 2 minutes max age (shorter)
  private isLoggingOut = false;

  getCachedSession(): any | null {
    // If we're in the process of logging out, don't return cached session
    if (this.isLoggingOut) return null;

    if (!this.cache) return null;

    const now = Date.now();
    const isExpired = now - this.cache.timestamp > this.MAX_AGE;
    const isStale = now - this.cache.timestamp > this.CACHE_DURATION;

    if (isExpired) {
      this.cache = null;
      return null;
    }

    // Check if session is actually expired (not just cache expired)
    if (this.cache.session?.expires_at) {
      const sessionExpired = now > this.cache.session.expires_at * 1000;
      if (sessionExpired) {
        this.cache = null;
        return null;
      }
    }

    return {
      ...this.cache.session,
      isStale, // Indicate if data is stale but still usable
    };
  }

  setCachedSession(session: any): void {
    if (!session) {
      this.cache = null;
      return;
    }

    this.cache = {
      session,
      timestamp: Date.now(),
      expiresAt: session.expires_at
        ? session.expires_at * 1000
        : Date.now() + this.MAX_AGE,
    };

    // Also store in sessionStorage for immediate access
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem("supabase.auth.token", JSON.stringify(session));
      } catch (error) {
        console.warn("Failed to store session in sessionStorage:", error);
      }
    }
  }

  clearCache(): void {
    this.cache = null;
  }

  setLoggingOut(loggingOut: boolean): void {
    this.isLoggingOut = loggingOut;
    if (loggingOut) {
      this.cache = null;
    }
  }

  isSessionValid(): boolean {
    if (!this.cache) return false;

    const now = Date.now();
    return now < this.cache.expiresAt;
  }
}

// Export singleton instance
export const sessionCache = new SessionCache();

/**
 * Get session with caching to reduce redundant calls
 */
export async function getCachedSession(supabase: any) {
  const cached = sessionCache.getCachedSession();

  // Return cached session if it's still valid and not stale
  if (cached && !cached.isStale) {
    return { data: { session: cached } };
  }

  // If we have stale data, return it immediately and refresh in background
  if (cached && cached.isStale) {
    // Refresh in background
    supabase.auth.getSession().then(({ data }: any) => {
      if (data.session) {
        sessionCache.setCachedSession(data.session);
      }
    });

    return { data: { session: cached } };
  }

  // No cached data, fetch fresh
  try {
    const result = await supabase.auth.getSession();
    if (result.data.session) {
      sessionCache.setCachedSession(result.data.session);
    }
    return result;
  } catch (error) {
    console.error("Error fetching session:", error);

    // Handle refresh token errors
    await handleAuthError(error);

    return { data: { session: null } };
  }
}
