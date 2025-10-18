import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ShieldOff, ArrowLeft } from "lucide-react";

export default function Forbidden() {
  const router = useRouter();

  const handleGoBack = () => {
    router.back();
  };

  return (
    <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
      <ShieldOff className="h-24 w-24 text-red-500" />
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-foreground">Access Denied</h1>
        <p className="text-lg text-muted-foreground max-w-md">
          You don't have permission to access this page. Please contact your
          administrator if you believe this is an error.
        </p>
      </div>
      <Button onClick={handleGoBack} className="flex items-center gap-2">
        <ArrowLeft className="h-4 w-4" />
        Go Back
      </Button>
    </div>
  );
}
