
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Search, Home } from "lucide-react";

export default function NotFound() {
  const router = useRouter();

  const handleGoHome = () => {
    router.push("/dashboard");
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <Search className="h-24 w-24 text-muted-foreground mx-auto" />
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-foreground">Page Not Found</h1>
          <p className="text-lg text-muted-foreground max-w-md">
            The page you're looking for doesn't exist or has been moved. Please check the URL and try again.
          </p>
        </div>
        <Button onClick={handleGoHome} className="flex items-center gap-2">
          <Home className="h-4 w-4" />
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
}
