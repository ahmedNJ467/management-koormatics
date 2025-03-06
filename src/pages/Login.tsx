
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await signIn(email, password);
      navigate("/");
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login failed",
        description: "Invalid email or password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <Card className="border-0 shadow-md dark:bg-gray-800/60 dark:backdrop-blur-sm">
        <CardContent className="p-6">
          <h2 className="text-xl font-bold mb-6 text-center">Login to your account</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full"
              />
            </div>
            <div className="pt-2">
              <Button
                type="submit"
                className="w-full bg-secondary hover:bg-secondary/90"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Please wait
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </div>
            <div className="text-center text-sm mt-4">
              <a
                href="/forgot-password"
                className="text-secondary hover:underline"
              >
                Forgot password?
              </a>
            </div>
            <div className="text-center text-sm">
              Don't have an account?{" "}
              <a href="/register" className="text-secondary hover:underline">
                Register
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
