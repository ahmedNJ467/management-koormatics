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

    // Ensure password field type is "password" for password manager detection
    // Password managers need the field to be type="password" when form is submitted
    const passwordInput = document.getElementById("password") as HTMLInputElement;
    const wasPasswordVisible = showPassword;
    if (wasPasswordVisible && passwordInput) {
      passwordInput.type = "password";
      // Temporarily update state to match (will be restored if login fails)
      setShowPassword(false);
    }

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

      // Immediately after authentication, check if user has access to this portal
      // BEFORE showing any success message or storing session
      if (authData?.user) {
        // Get user roles immediately
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
          // Fallback to database query - this must be fast
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

        // If user doesn't have access, immediately sign them out and throw error
        // This makes it appear as if authentication never succeeded
        if (!hasAccess) {
          // Sign out immediately - this invalidates the session
          await supabase.auth.signOut({ scope: "local" });
          
          // Clear ALL session and storage data immediately
          if (typeof window !== "undefined") {
            try {
              sessionStorage.removeItem("supabase.auth.token");
              sessionStorage.clear();
              localStorage.removeItem("koormatics_saved_email");
              localStorage.removeItem("koormatics_remember_me");
              // Also clear any cached session
              const { data: { session } } = await supabase.auth.getSession();
              if (session) {
                await supabase.auth.signOut();
              }
            } catch (error) {
              console.warn("Failed to clear storage:", error);
            }
          }

          // Throw an error that looks like an authentication failure
          // This prevents any success flow from executing
          throw new Error("Invalid login credentials");
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

      // Trigger form submission event for password manager detection
      // This helps password managers recognize the successful login
      const form = e.currentTarget as HTMLFormElement;
      if (form) {
        // Create a synthetic submit event
        const submitEvent = new Event("submit", { bubbles: true, cancelable: true });
        form.dispatchEvent(submitEvent);
      }

      // Use replace instead of push for instant redirect
      router.replace(dashboardPath);
    } catch (error) {
      // Restore password visibility if login failed
      if (wasPasswordVisible && passwordInput) {
        passwordInput.type = "text";
        setShowPassword(true);
      }
      console.error("Auth error:", error);
      
      // For access denied errors, show invalid credentials (don't reveal the real reason)
      const errorMessage = error instanceof Error ? error.message : "";
      const isAccessDenied = errorMessage === "Invalid login credentials";
      
      toast({
        title: "Invalid credentials",
        description:
          error instanceof Error
            ? errorMessage.includes("timeout")
              ? "Connection timeout. Please check your internet connection and try again."
              : errorMessage.includes("Invalid login credentials") ||
                errorMessage.includes("invalid_credentials") ||
                isAccessDenied
              ? "The email or password you entered is incorrect. Please check your credentials and try again."
              : errorMessage.includes("Email not confirmed")
              ? "Please check your email and click the confirmation link before signing in."
              : errorMessage.includes("Too many requests")
              ? "Too many sign-in attempts. Please wait a few minutes before trying again."
              : "The email or password you entered is incorrect. Please check your credentials and try again."
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
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-8">
            <KoormaticsLogo size="xl" />
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-card border border-border rounded-lg shadow-sm p-8">
          {/* Portal Badge */}
          {domain && (
            <div className="text-center mb-6">
              <span className="inline-block px-3 py-1 text-xs font-medium text-muted-foreground bg-muted rounded-full">
                Portal: {domain.toUpperCase()}
              </span>
            </div>
          )}

          {/* Login Form */}
          <form 
            onSubmit={handleAuth} 
            className="space-y-5" 
            autoComplete="on"
            method="post"
            action="#"
            noValidate
          >
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                className="pl-10 h-12 bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-primary"
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
                className="pl-3 pr-10 h-12 bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-primary"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground h-8 w-8"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center">
              <label className="flex items-center space-x-2 text-sm text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary focus:ring-offset-0"
                />
                <span>Remember me</span>
              </label>
            </div>

            <Button
              type="submit"
              variant="default"
              size="lg"
              className="w-full h-12 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading || isRedirecting}
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-muted border-t-primary rounded-full animate-spin"></div>
                  Logging in...
                </div>
              ) : isRedirecting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-muted border-t-primary rounded-full animate-spin"></div>
                  Redirecting...
                </div>
              ) : (
                "Log in"
              )}
            </Button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-muted-foreground text-xs">
            © {currentYear} Koormatics - All rights reserved
          </p>
        </div>
      </div>
    </div>
  );
}
