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

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
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

        // Redirect to dashboard
        setIsRedirecting(true);
        router.push("/dashboard");
      }
    } catch (error) {
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-blue-600 font-medium">
            Redirecting to Fleet Portal...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Fleet Portal Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-800">
        {/* Fleet-themed pattern overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.3),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(99,102,241,0.2),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(59,130,246,0.2),transparent_50%)]"></div>
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Fleet Portal Branding */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-full p-4 mr-4">
                <Car className="h-8 w-8 text-white" />
              </div>
              <KoormaticsLogo size="xl" className="drop-shadow-lg" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Fleet Portal</h1>
            <div className="text-white/80 text-sm mb-2">
              Fleet Management System
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleAuth} className="space-y-4" autoComplete="on">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-white"
                >
                  Email Address
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-white/90 border-white/20"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-white"
                >
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10 bg-white/90 border-white/20"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 h-4 w-4 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2 text-white text-sm">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-white/20 bg-white/10"
                  />
                  <span>Remember me</span>
                </label>
              </div>

              <Button
                type="submit"
                className="w-full bg-white text-blue-600 hover:bg-white/90 font-medium"
                disabled={isLoading}
              >
                {isLoading ? "Signing In..." : "Sign In to Fleet Portal"}
              </Button>
            </div>
          </form>

          {/* Footer */}
          <div className="text-center mt-8 text-white/60 text-sm">
            <p>&copy; {currentYear} Koormatics Fleet Management System</p>
            <p className="mt-1">
              Access restricted to authorized fleet managers
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
