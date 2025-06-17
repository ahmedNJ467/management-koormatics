
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Lock, User, Eye, EyeOff, Truck, Car } from "lucide-react";

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
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-slate-900">
      {/* Animated Background with Moving Vehicles */}
      <div className="absolute inset-0">
        {/* Road lines */}
        <div className="absolute inset-0 opacity-10">
          <div className="h-full w-full" style={{
            backgroundImage: `repeating-linear-gradient(
              0deg,
              transparent,
              transparent 50px,
              rgba(255,255,255,0.1) 50px,
              rgba(255,255,255,0.1) 52px
            )`
          }}></div>
        </div>
        
        {/* Moving vehicles */}
        <div className="absolute inset-0">
          {/* Vehicle 1 */}
          <div 
            className="absolute top-1/4 left-0 text-blue-300/30 animate-[moveRight_15s_linear_infinite]"
            style={{ animationDelay: '0s' }}
          >
            <Truck size={40} />
          </div>
          
          {/* Vehicle 2 */}
          <div 
            className="absolute top-2/4 left-0 text-green-300/30 animate-[moveRight_20s_linear_infinite]"
            style={{ animationDelay: '5s' }}
          >
            <Car size={32} />
          </div>
          
          {/* Vehicle 3 */}
          <div 
            className="absolute top-3/4 left-0 text-blue-400/30 animate-[moveRight_18s_linear_infinite]"
            style={{ animationDelay: '10s' }}
          >
            <Truck size={36} />
          </div>
          
          {/* Vehicle 4 - smaller car */}
          <div 
            className="absolute top-1/3 left-0 text-slate-300/30 animate-[moveRight_25s_linear_infinite]"
            style={{ animationDelay: '15s' }}
          >
            <Car size={28} />
          </div>
        </div>
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 via-blue-800/70 to-blue-900/90"></div>
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
            <h1 className="text-2xl font-bold text-white mb-2">
              Koormatics Transportation & Logistics
            </h1>
            <p className="text-blue-200 text-sm">
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
            <p className="text-white/60 text-xs">
              © 2024 Koormatics Transportation & Logistics
            </p>
            <p className="text-white/40 text-xs">
              All rights reserved | Fleet Management System
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
