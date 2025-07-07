import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ShieldOff } from "lucide-react";

export default function Forbidden() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center h-full text-center space-y-6 animate-fade-in">
      <ShieldOff className="h-12 w-12 text-destructive" />
      <h2 className="text-3xl font-bold">403 – Forbidden</h2>
      <p className="text-muted-foreground max-w-md">
        You don't have permission to access this page. Contact an administrator
        if you believe this is an error.
      </p>
      <Button onClick={() => navigate("/dashboard")}>Return to Dashboard</Button>
    </div>
  );
} 