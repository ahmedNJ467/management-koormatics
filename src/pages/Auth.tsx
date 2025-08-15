import { useState, useEffect } from "react";
import { useTenantScope } from "@/hooks/use-tenant-scope";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User, Eye, EyeOff } from "lucide-react";
import { debugDomainDetection } from "@/utils/subdomain";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { domain } = useTenantScope();
  const currentYear = new Date().getFullYear();

  // Debug domain detection
  useEffect(() => {
    console.log("🔐 Auth Component - Domain detected:", domain);
    debugDomainDetection();
  }, [domain]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      toast({
        title: "Welcome back!",
        description: "Successfully signed in to Koormatics",
      });

      const dashboardPath =
        domain === "fleet"
          ? "/dashboard-fleet"
          : domain === "operations"
          ? "/dashboard-ops"
          : domain === "finance"
          ? "/dashboard-finance"
          : "/dashboard-management";

      console.log("🔐 Redirecting to:", dashboardPath, "for domain:", domain);
      navigate(dashboardPath);
    } catch (error) {
      toast({
        title: "Authentication failed",
        description:
          error instanceof Error
            ? error.message
            : "Invalid credentials. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Check if user is already logged in on component mount
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        const dashboardPath =
          domain === "fleet"
            ? "/dashboard-fleet"
            : domain === "operations"
            ? "/dashboard-ops"
            : domain === "finance"
            ? "/dashboard-finance"
            : "/dashboard-management";

        console.log(
          "🔐 Auto-redirect to:",
          dashboardPath,
          "for domain:",
          domain
        );
        navigate(dashboardPath);
      }
    };

    checkAuth();
  }, [navigate, domain]);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Land Cruiser Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('/lovable-uploads/14ff090f-1304-4931-b1f4-f858de64682f.png')`,
        }}
      >
        {/* Dark overlay for better readability */}
        <div className="absolute inset-0 bg-black/60"></div>
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Company Logo and Branding */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-6">
              <img
                src="/lovable-uploads/4ac6bd3a-707d-4262-bc89-af00beb7077e.png"
                alt="Koormatics"
                className="h-20 object-contain drop-shadow-lg"
              />
            </div>
            {/* Show current domain for debugging */}
            <div className="text-white/80 text-sm mb-2">
              Portal: {domain.toUpperCase()}
            </div>
          </div>

          {/* Simplified Login */}
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/70" />
              <Input
                id="email"
                type="email"
                placeholder="User"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-10 h-12 bg-white/5 border border-white/20 text-white placeholder:text-white/70 rounded-md focus:outline-none focus:ring-0 focus-visible:ring-0 focus:ring-offset-0 focus-visible:ring-offset-0 focus:border-purple-400 transition-colors"
              />
            </div>

            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pl-3 pr-10 h-12 bg-white/5 border border-white/20 text-white placeholder:text-white/70 rounded-md focus:outline-none focus:ring-0 focus-visible:ring-0 focus:ring-offset-0 focus-visible:ring-offset-0 focus:border-purple-400 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>

            <Button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium h-12 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
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
          </div>
        </div>
      </div>
    </div>
  );
}
