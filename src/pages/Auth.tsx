import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getCachedSession } from "@/lib/session-cache";
import { useTenantScope } from "@/hooks/use-tenant-scope";
import { User, Eye, EyeOff, Car } from "lucide-react";
import KoormaticsLogo from "@/components/ui/koormatics-logo";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { domain } = useTenantScope();
  const currentYear = new Date().getFullYear();

  const isFleetPortal = domain === "fleet";

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Add timeout and better error handling
      const authPromise = supabase.auth.signInWithPassword({
        email,
        password,
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Request timeout")), 10000)
      );

      const { data: authData, error } = (await Promise.race([
        authPromise,
        timeoutPromise,
      ])) as any;
      if (error) throw error;

      // After successful authentication, check if user has access to this portal
      if (authData?.user) {
        // Get user roles
        const userId = authData.user.id;
        let userRoles: string[] = [];

        // Try to get roles from user metadata first (faster)
        const meta = (authData.user.user_metadata as any) || {};
        const metaRoles: string[] = Array.isArray(meta?.koormatics_role)
          ? meta.koormatics_role
          : meta?.role
          ? [meta.role]
          : [];

        if (metaRoles.length > 0) {
          userRoles = metaRoles;
        } else {
          // Fallback to database query
          try {
            const { data, error: rolesError } = await supabase
              .from("vw_user_roles")
              .select("roles")
              .eq("user_id", userId)
              .maybeSingle();

            if (!rolesError && data?.roles) {
              userRoles = data.roles as string[];
            } else if (metaRoles.length > 0) {
              userRoles = metaRoles;
            }
          } catch (rolesErr) {
            console.error("Error fetching roles:", rolesErr);
            // If we can't fetch roles, use metadata roles if available
            userRoles = metaRoles;
          }
        }

        // Check if user has access to this domain
        const hasSuperAdmin = userRoles.includes("super_admin");
        const hasFleetManager = userRoles.includes("fleet_manager");
        const hasOperationsManager = userRoles.includes("operations_manager");
        const hasFinanceManager = userRoles.includes("finance_manager");

        let hasAccess = false;
        if (domain === "management") {
          hasAccess = hasSuperAdmin; // Only super_admin can access management
        } else if (domain === "fleet") {
          hasAccess = hasFleetManager || hasSuperAdmin;
        } else if (domain === "operations") {
          hasAccess = hasOperationsManager || hasSuperAdmin;
        } else if (domain === "finance") {
          hasAccess = hasFinanceManager || hasSuperAdmin;
        } else {
          hasAccess = hasSuperAdmin; // Default to super_admin only
        }

        // If user doesn't have access, sign them out and show invalid credentials
        if (!hasAccess) {
          // Sign out the user immediately
          await supabase.auth.signOut({ scope: "local" });
          
          // Clear any session storage
          if (typeof window !== "undefined") {
            try {
              sessionStorage.removeItem("supabase.auth.token");
              localStorage.removeItem("koormatics_saved_email");
              localStorage.removeItem("koormatics_remember_me");
            } catch (error) {
              console.warn("Failed to clear storage:", error);
            }
          }

          // Show invalid credentials error (don't reveal they have valid credentials but wrong portal)
          toast({
            title: "Invalid credentials",
            description: "The email or password you entered is incorrect. Please check your credentials and try again.",
            variant: "destructive",
          });
          setIsLoading(false);
          setIsRedirecting(false);
          return;
        }
      }

      // Save credentials if "Remember Me" is checked
      if (rememberMe) {
        try {
          localStorage.setItem("koormatics_saved_email", email);
          localStorage.setItem("koormatics_remember_me", "true");
        } catch (error) {
          console.warn("Failed to save credentials:", error);
        }
      } else {
        // Clear saved credentials if "Remember Me" is unchecked
        try {
          localStorage.removeItem("koormatics_saved_email");
          localStorage.removeItem("koormatics_remember_me");
        } catch (error) {
          console.warn("Failed to clear saved credentials:", error);
        }
      }

      // Show success toast immediately
      toast({
        title: `Welcome to ${isFleetPortal ? "Fleet Portal" : "Koormatics"}!`,
        description: `Successfully signed in to ${
          isFleetPortal ? "fleet management" : "Koormatics"
        }`,
      });

      // Determine dashboard path immediately based on domain
      const dashboardPath = "/dashboard";

      // Set redirecting state and redirect immediately
      setIsLoading(false);
      setIsRedirecting(true);

      // Store session in sessionStorage for instant access
      if (typeof window !== "undefined") {
        try {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (session) {
            sessionStorage.setItem(
              "supabase.auth.token",
              JSON.stringify(session)
            );
          }
        } catch (error) {
          console.warn("Failed to store session:", error);
        }
      }

      // Use replace instead of push for instant redirect
      router.replace(dashboardPath);
    } catch (error) {
      console.error("Auth error:", error);
      toast({
        title: "Unable to sign in",
        description:
          error instanceof Error
            ? error.message.includes("timeout")
              ? "Connection timeout. Please check your internet connection and try again."
              : error.message.includes("Invalid login credentials") ||
                error.message.includes("invalid_credentials")
              ? "The email or password you entered is incorrect. Please check your credentials and try again."
              : error.message.includes("Email not confirmed")
              ? "Please check your email and click the confirmation link before signing in."
              : error.message.includes("Too many requests")
              ? "Too many sign-in attempts. Please wait a few minutes before trying again."
              : "Something went wrong. Please try again in a moment."
            : "The email or password you entered is incorrect. Please check your credentials and try again.",
        variant: "destructive",
      });
      setIsLoading(false);
      setIsRedirecting(false);
    }
  };

  // Load saved credentials on component mount
  useEffect(() => {
    const loadSavedCredentials = () => {
      try {
        const savedEmail = localStorage.getItem("koormatics_saved_email");
        const savedRememberMe =
          localStorage.getItem("koormatics_remember_me") === "true";

        if (savedEmail && savedRememberMe) {
          setEmail(savedEmail);
          setRememberMe(true);
        }
      } catch (error) {
        console.warn("Failed to load saved credentials:", error);
      }
    };

    loadSavedCredentials();
  }, []);

  // Check if user is already logged in on component mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Add timeout for session check
        const session = await getCachedSession(supabase);
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Session check timeout")), 5000)
        );

        const {
          data: { session: sessionFromCache },
        } = (await Promise.race([session, timeoutPromise])) as any;

        // Only redirect if we have a valid session and we're not in logout process
        if (sessionFromCache?.user) {
          const dashboardPath = "/dashboard";

          // Redirect immediately if user is already authenticated
          router.replace(dashboardPath);
        }
      } catch (error) {
        console.error("Session check error:", error);
        // Don't redirect on error, let user try to login
      }
    };

    // Check auth immediately for instant login
    checkAuth();
  }, [router, domain]);

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Portal-specific Branding */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-6">
              <KoormaticsLogo size="xl" className="drop-shadow-lg" />
            </div>
            <div className="text-white/80 text-sm mb-2">
              Portal: {domain.toUpperCase()}
            </div>
          </div>

          {/* Login Form with Browser Credential Saving */}
          <form onSubmit={handleAuth} className="space-y-4" autoComplete="on">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/70" />
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                className="pl-10 h-12 bg-white/5 border border-white/20 text-white placeholder:text-white/70 rounded-md focus:outline-none focus:ring-0 focus-visible:ring-0 focus:ring-offset-0 focus-visible:ring-offset-0 focus:border-purple-400 transition-colors"
              />
            </div>

            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                className="pl-3 pr-10 h-12 bg-white/5 border border-white/20 text-white placeholder:text-white/70 rounded-md focus:outline-none focus:ring-0 focus-visible:ring-0 focus:ring-offset-0 focus-visible:ring-offset-0 focus:border-purple-offset-0 focus:border-purple-400 transition-colors"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-white/70 hover:text-white h-8 w-8"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 text-white/80 text-sm">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-white/20 bg-white/5 text-purple-600 focus:ring-purple-500 focus:ring-offset-0"
                />
                <span>Remember me</span>
              </label>
            </div>

            <Button
              type="submit"
              variant="default"
              size="lg"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium h-12 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading || isRedirecting}
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Logging in...
                </div>
              ) : isRedirecting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Redirecting...
                </div>
              ) : (
                "Log in"
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="text-center mt-6">
            <p className="text-white/80 text-xs drop-shadow">
              © {currentYear} Koormatics · All rights reserved
            </p>
            <p className="text-white/60 text-xs mt-1">
              Access restricted to authorized personnel
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
