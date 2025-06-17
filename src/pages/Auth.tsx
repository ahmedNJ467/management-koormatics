
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Lock, User, Eye, EyeOff } from "lucide-react";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

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
        description: "Successfully signed in to Koormatics Management System",
      });
      navigate("/dashboard");
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

  // Check if user is already logged in
  supabase.auth.onAuthStateChange((_event, session) => {
    if (session) {
      navigate("/dashboard");
    }
  });

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Real Transportation Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')`,
        }}
      >
        {/* Dark overlay for better readability */}
        <div className="absolute inset-0 bg-black/50"></div>
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Company Logo and Branding */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-6">
              <img
                src="/lovable-uploads/4ac6bd3a-707d-4262-bc89-af00beb7077e.png"
                alt="Koormatics Transportation & Logistics"
                className="h-20 object-contain drop-shadow-lg"
              />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
              Koormatics Transportation & Logistics
            </h1>
            <p className="text-white/90 text-sm drop-shadow">
              Fleet Management System
            </p>
          </div>

          {/* Login Card */}
          <Card className="backdrop-blur-xl bg-white/95 border-0 shadow-2xl rounded-2xl overflow-hidden">
            <CardHeader className="text-center bg-gradient-to-r from-blue-50 to-slate-50 pb-6">
              <CardTitle className="text-gray-800 flex items-center justify-center gap-3 text-xl">
                <Lock className="h-5 w-5 text-blue-600" />
                Administrator Access
              </CardTitle>
              <p className="text-sm text-gray-600 mt-2">
                Sign in to manage your fleet operations
              </p>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleAuth} className="space-y-6">
                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700 font-medium">
                    Email Address
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@koormatics.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="pl-10 h-12 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500 rounded-lg transition-all duration-200"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-700 font-medium">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your secure password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="pl-10 pr-10 h-12 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500 rounded-lg transition-all duration-200"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Options Row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="remember"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <Label htmlFor="remember" className="text-sm text-gray-600">
                      Remember me
                    </Label>
                  </div>
                  <button
                    type="button"
                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Login Button */}
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 h-12 rounded-lg transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Authenticating...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Sign In to Dashboard
                    </div>
                  )}
                </Button>

                {/* Security Notice */}
                <div className="text-center">
                  <p className="text-xs text-gray-500">
                    Secure connection protected by SSL encryption
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center mt-6 space-y-2">
            <p className="text-white/80 text-xs drop-shadow">
              © 2024 Koormatics Transportation & Logistics
            </p>
            <p className="text-white/60 text-xs drop-shadow">
              All rights reserved | Fleet Management System
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
