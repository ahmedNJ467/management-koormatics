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
import { useTenantScope } from "@/hooks/use-tenant-scope";
import { preloadByPath } from "@/routes/pages";
import { usePageAccess } from "@/hooks/use-page-access";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useRole } from "@/hooks/useRole";

interface NavbarProps {
  onMenuClick: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const { profile } = useProfile();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { domain } = useTenantScope();
  const { hasRole } = useRole();
  const { data: pages = [] } = usePageAccess();

  const isPageAllowed = (href: string) => {
    if (pages.includes("*")) return true;
    const id = href.startsWith("/") ? href.slice(1) : href;
    const first = id.split("/")[0] || id;
    return pages.includes(id) || pages.includes(first);
  };

  const dashboardPathByDomain =
    domain === "fleet"
      ? "/dashboard-fleet"
      : domain === "operations"
      ? "/dashboard-ops"
      : domain === "finance"
      ? "/dashboard-finance"
      : "/dashboard-management";

  const canSeeDashboard =
    isPageAllowed(dashboardPathByDomain) || isPageAllowed("/dashboard");
  const canSeeProfile = isPageAllowed("/profile");
  const canSeeSettings = isPageAllowed("/settings");
  const firstAllowedPath = pages.find(Boolean)
    ? `/${(pages[0] || "").replace(/^\//, "")}`
    : "/403";
  const homePath = canSeeDashboard ? dashboardPathByDomain : firstAllowedPath;

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleProfileClick = () => {
    navigate("/profile");
  };

  const handleSettingsClick = () => {
    navigate("/settings");
  };

  const handleLogoutClick = async () => {
    try {
      // First, try to get current session to verify auth state
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        // No active session, just redirect to auth
        toast({
          title: "No active session",
          description: "Redirecting to login page",
        });
        navigate("/auth");
        return;
      }

      // Clear any local auth state first
      localStorage.removeItem("supabase.auth.token");
      sessionStorage.clear();

      // Attempt to sign out with explicit scope
      const { error } = await supabase.auth.signOut({
        scope: "local", // Only clear local session, don't call server
      });

      if (error) {
        console.error("Logout error:", error);

        // If logout fails, still redirect to auth and clear local state
        toast({
          title: "Session expired",
          description: "Redirecting to login page",
        });

        navigate("/auth");
        return;
      }

      toast({
        title: "Logged out successfully",
        description: "You have been signed out of the system",
      });

      // Redirect to auth page
      navigate("/auth");
    } catch (error) {
      console.error("Logout exception:", error);

      toast({
        title: "Logout failed",
        description: "An error occurred during logout. Redirecting to login.",
        variant: "destructive",
      });

      // Force redirect even if logout fails
      navigate("/auth");
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
    <header className="h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-40">
      <div className="flex h-16 items-center px-4 gap-4">
        <Button variant="ghost" size="icon" onClick={onMenuClick}>
          <Menu className="h-5 w-5" />
        </Button>

        <Link
          to={homePath}
          className="flex items-center"
          onMouseEnter={() => preloadByPath(homePath)}
        >
          <img
            src="/lovable-uploads/3b576d68-bff3-4323-bab0-d4afcf9b85c2.png"
            alt="Koormatics Logo"
            className="h-8 object-contain"
          />
          <span className="ml-2 text-xs text-muted-foreground hidden sm:inline">
            /{domain}
          </span>
        </Link>

        <div className="hidden sm:flex flex-1 justify-center max-w-sm mx-auto">
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
                {canSeeProfile && (
                  <>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </>
                )}
              </DropdownMenuItem>
              {hasRole("super_admin") && canSeeSettings && (
                <DropdownMenuItem onClick={handleSettingsClick}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
              )}
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
