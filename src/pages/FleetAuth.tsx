"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getCachedSession } from "@/lib/session-cache";
import { User, Eye, EyeOff, Car } from "lucide-react";
import KoormaticsLogo from "@/components/ui/koormatics-logo";

export default function FleetAuth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const currentYear = new Date().getFullYear();

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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Restore password visibility if login failed
        if (wasPasswordVisible && passwordInput) {
          passwordInput.type = "text";
          setShowPassword(true);
        }
        toast({
          title: "Authentication Failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      if (data.user) {
        toast({
          title: "Welcome to Fleet Portal",
          description: "Successfully signed in to the fleet management system.",
        });

        // Help password managers detect successful login
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

        // Small delay before redirect to allow password managers to detect successful login
        // Password managers need time to process the form submission and detect the success
        await new Promise(resolve => setTimeout(resolve, 500));

        // Use full page navigation instead of client-side router for password manager detection
        // Password managers detect successful logins by monitoring full page navigations
        if (typeof window !== "undefined") {
          window.location.href = "/dashboard";
        } else {
        setIsRedirecting(true);
        router.push("/dashboard");
        }
      }
    } catch (error) {
      // Restore password visibility if login failed
      if (wasPasswordVisible && passwordInput) {
        passwordInput.type = "text";
        setShowPassword(true);
      }
      console.error("Auth error:", error);
      toast({
        title: "Authentication Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Check if user is already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await getCachedSession(supabase);
        if (session?.user) {
          setIsRedirecting(true);
          router.push("/dashboard");
        }
      } catch (error) {
        console.log("No existing session found");
      }
    };

    checkAuth();
  }, [router]);

  if (isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white/30 border-t-white mx-auto mb-4"></div>
          <p className="text-white font-medium">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Fleet Portal Branding */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-6">
              <KoormaticsLogo size="xl" className="drop-shadow-lg" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Fleet Portal</h1>
            <div className="text-white/80 text-sm mb-2">Portal: FLEET</div>
          </div>

          {/* Login Form */}
          <form 
            id="login-form"
            name="login-form"
            onSubmit={handleAuth} 
            className="space-y-4" 
            autoComplete="on"
            method="post"
            noValidate
          >
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
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck="false"
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
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck="false"
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
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Logging in...
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
              Access restricted to authorized fleet managers
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
