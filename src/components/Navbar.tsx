import { Menu, User, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import { GlobalSearchTrigger } from "./global-search/GlobalSearchTrigger";
import { AlertsDropdown } from "./alerts/AlertsDropdown";
import { useProfile } from "@/hooks/use-profile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link, useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface NavbarProps {
  onMenuClick: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const { profile } = useProfile();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleProfileClick = () => {
    // Navigate to profile page
    window.location.href = "/profile";
  };

  const handleSettingsClick = () => {
    // Navigate to settings page
    window.location.href = "/settings";
  };

  const handleLogoutClick = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      toast({
        title: "Logged out successfully",
        description: "You have been signed out of the system",
      });

      // Redirect to auth page
      navigate("/auth");
    } catch (error) {
      toast({
        title: "Logout failed",
        description:
          error instanceof Error
            ? error.message
            : "An error occurred during logout",
        variant: "destructive",
      });
    }
  };

  // Render a placeholder on initial mount to avoid theme flash
  if (!mounted) {
    return (
      <header className="h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center px-4 gap-4">
          <div className="h-10 w-10 bg-muted rounded-lg animate-pulse" />
          <div className="h-8 w-32 bg-muted rounded-md animate-pulse" />
          <div className="flex-1 flex justify-center max-w-sm mx-auto">
            <div className="h-10 w-full bg-muted rounded-lg animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 bg-muted rounded-lg animate-pulse" />
            <div className="h-10 w-10 bg-muted rounded-lg animate-pulse" />
            <div className="h-12 w-12 bg-muted rounded-full animate-pulse" />
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-4 gap-4">
        <Button variant="ghost" size="icon" onClick={onMenuClick}>
          <Menu className="h-5 w-5" />
        </Button>

        <Link to="/dashboard" className="flex items-center">
          <img
            src="/lovable-uploads/3b576d68-bff3-4323-bab0-d4afcf9b85c2.png"
            alt="Koormatics Logo"
            className="h-8 object-contain"
          />
        </Link>

        <div className="flex-1 flex justify-center max-w-sm mx-auto">
          <GlobalSearchTrigger />
        </div>

        <div className="flex items-center gap-2">
          <AlertsDropdown />
          <ThemeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-12 w-12 rounded-full"
              >
                <Avatar className="h-12 w-12">
                  <AvatarImage
                    src={profile?.profile_image_url || "/placeholder.svg"}
                    alt="Admin"
                  />
                  <AvatarFallback>
                    {profile?.name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase() || "AD"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {profile?.name || "Admin User"}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {profile?.email || "admin@fleetmanagement.com"}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleProfileClick}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSettingsClick}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogoutClick}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
