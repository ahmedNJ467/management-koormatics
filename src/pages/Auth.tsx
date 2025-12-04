import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getCachedSession, sessionCache } from "@/lib/session-cache";
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

      // Ensure session is properly stored before redirecting
      // Get the session from the auth response
      let sessionToStore = authData?.session;
      
      // If not in authData, get it from Supabase
      if (!sessionToStore) {
        const { data: { session } } = await supabase.auth.getSession();
        sessionToStore = session;
      }

      // Store session in sessionStorage and cache for instant access
      if (sessionToStore && typeof window !== "undefined") {
        try {
          // Store in sessionStorage
          sessionStorage.setItem(
            "supabase.auth.token",
            JSON.stringify(sessionToStore)
          );
          // Also update the session cache
          sessionCache.setCachedSession(sessionToStore);
        } catch (error) {
          console.warn("Failed to store session:", error);
        }
      }

      // Help password managers detect successful login
      // Password managers detect successful logins by monitoring form submissions and navigation
      // We need to ensure the form structure is visible and the navigation happens after a brief delay
      const form = e.currentTarget as HTMLFormElement;
      
      // Use Credential Management API if available to help password managers
      if (typeof window !== "undefined" && "PasswordCredential" in window) {
        try {
          const cred = new (window as any).PasswordCredential({
            id: email,
            password: password,
            name: email,
          });
          if ((navigator as any).credentials) {
            await (navigator as any).credentials.store(cred);
          }
        } catch (err) {
          // Credential API not supported or failed, continue with normal flow
        }
      }

      // Small delay before redirect to ensure session is fully persisted
      await new Promise(resolve => setTimeout(resolve, 200));

      // Use router.replace to avoid full page reload which causes session restoration issues
      // The session is already stored in sessionStorage and cache, so no need for full reload
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
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03]">
        <div className="absolute inset-0" style={{
          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 35px, currentColor 35px, currentColor 70px)`,
        }} />
      </div>

      <div className="relative min-h-screen flex">
        {/* Left Side - Branding (hidden on mobile) */}
        <div className="hidden lg:flex lg:w-2/5 xl:w-2/5 bg-gradient-to-br from-primary/5 via-primary/3 to-transparent items-center justify-center p-12 relative">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_50%,rgba(59,130,246,0.1),transparent_50%)]" />
          <div className="relative z-10 max-w-sm">
            <div className="mb-6">
              <KoormaticsLogo size="xl" />
            </div>
            <h1 className="text-3xl font-bold mb-3 tracking-tight">
              Welcome back
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Sign in to access your dashboard and manage your operations.
            </p>
            {domain && (
              <div className="mt-6 inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-md">
                <span className="text-xs font-medium text-primary">{domain.toUpperCase()} Portal</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-[420px]">
            {/* Mobile Logo */}
            <div className="lg:hidden mb-10">
              <div className="mb-6">
                <KoormaticsLogo size="lg" />
              </div>
              {domain && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-md mb-4">
                  <span className="text-xs font-medium text-primary">{domain.toUpperCase()} Portal</span>
                </div>
              )}
            </div>

            {/* Desktop Title */}
            <div className="hidden lg:block mb-8">
              <h2 className="text-2xl font-semibold mb-2">Sign in</h2>
              <p className="text-sm text-muted-foreground">Enter your credentials to continue</p>
            </div>

            {/* Login Form */}
            <form 
              id="login-form"
              name="login-form"
              onSubmit={handleAuth} 
              className="space-y-4" 
              autoComplete="on"
              method="post"
              action={typeof window !== "undefined" ? window.location.href : "#"}
              noValidate
            >
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1.5 text-foreground">
                  Email
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    autoCapitalize="off"
                    autoCorrect="off"
                    spellCheck="false"
                    required
                    className="pl-10 h-11 bg-background border-border/60 text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-1.5 text-foreground">
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    autoCapitalize="off"
                    autoCorrect="off"
                    spellCheck="false"
                    required
                    className="pl-3 pr-10 h-11 bg-background border-border/60 text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground h-8 w-8 hover:bg-transparent"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-1 focus:ring-primary/20 focus:ring-offset-0 cursor-pointer"
                  />
                  <span className="group-hover:text-foreground/80 transition-colors">Remember me</span>
                </label>
              </div>

              <Button
                type="submit"
                variant="default"
                size="lg"
                className="w-full h-11 font-medium mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading || isRedirecting}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                    <span>Signing in...</span>
                  </div>
                ) : isRedirecting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                    <span>Redirecting...</span>
                  </div>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>

            {/* Footer */}
            <div className="mt-12 pt-6 border-t border-border/40">
              <p className="text-xs text-muted-foreground/70 text-center">
                © {currentYear} Koormatics. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
