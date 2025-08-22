import React, { useState, useEffect, useCallback, memo } from "react";
import { Menu, User, Settings, LogOut, PanelLeftClose } from "lucide-react";
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
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTenantScope } from "@/hooks/use-tenant-scope";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { usePageAccess } from "@/hooks/use-page-access";
import { useTheme } from "next-themes";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useRole } from "@/hooks/useRole";
import { ConnectionStatus } from "./ConnectionStatus";
import KoormaticsLogo from "@/components/ui/koormatics-logo";

interface NavbarProps {
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
}

const Navbar = memo(function Navbar({
  onToggleSidebar,
  sidebarOpen,
}: NavbarProps) {
  const { profile } = useProfile();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { domain } = useTenantScope();
  const { hasRole } = useRole();
  const { data: pages = [] } = usePageAccess();

  const isPageAllowed = useCallback(
    (href: string) => {
      if (pages.includes("*")) return true;
      const id = href.startsWith("/") ? href.slice(1) : href;
      const first = id.split("/")[0] || id;
      return pages.includes(id) || pages.includes(first);
    },
    [pages]
  );

  const dashboardPathByDomain = useCallback(() => {
    if (domain === "fleet") return "/dashboard-fleet";
    if (domain === "operations") return "/dashboard-ops";
    if (domain === "finance") return "/dashboard-finance";
    return "/dashboard-management";
  }, [domain]);

  const canSeeDashboard = useCallback(() => {
    const dashboardPath = dashboardPathByDomain();
    return isPageAllowed(dashboardPath) || isPageAllowed("/dashboard");
  }, [dashboardPathByDomain, isPageAllowed]);

  const canSeeProfile = useCallback(
    () => isPageAllowed("/profile"),
    [isPageAllowed]
  );
  const canSeeSettings = useCallback(
    () => isPageAllowed("/settings"),
    [isPageAllowed]
  );

  const firstAllowedPath = useCallback(() => {
    const firstPage = pages.find(Boolean);
    return firstPage ? `/${firstPage.replace(/^\//, "")}` : "/403";
  }, [pages]);

  const homePath = useCallback(() => {
    return canSeeDashboard() ? dashboardPathByDomain() : firstAllowedPath();
  }, [canSeeDashboard, dashboardPathByDomain, firstAllowedPath]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleProfileClick = useCallback(() => {
    router.push("/profile");
  }, [router]);

  const handleSettingsClick = useCallback(() => {
    router.push("/settings");
  }, [router]);

  const handleLogoutClick = useCallback(async () => {
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
        router.push("/auth");
        return;
      }

      // Clear any local auth state first
      localStorage.removeItem("supabase.auth.token");
      sessionStorage.clear();

      // Only attempt signOut if we have a valid session
      if (session.access_token) {
        try {
          const { error } = await supabase.auth.signOut({
            scope: "local", // Only clear local session, don't call server
          });

          if (error) {
            console.error("Logout error:", error);
          }
        } catch (signOutError) {
          console.error("SignOut error:", signOutError);
          // Continue with logout process even if signOut fails
        }
      }

      // Always show success message and redirect
      toast({
        title: "Logged out successfully",
        description: "You have been signed out of the system",
      });

      // Redirect to auth page
      router.push("/auth");
    } catch (error) {
      console.error("Logout exception:", error);

      // Even if there's an error, clear local state and redirect
      localStorage.removeItem("supabase.auth.token");
      sessionStorage.clear();

      toast({
        title: "Logout completed",
        description: "Redirecting to login page",
      });

      // Force redirect even if logout fails
      router.push("/auth");
    }
  }, [router, toast]);

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
    <header className="h-16 flex items-center px-4 gap-4">
      <Button variant="ghost" size="icon" onClick={onToggleSidebar}>
        <Menu className="h-5 w-5" />
      </Button>

      <Link href={homePath()} className="flex items-center">
        <KoormaticsLogo size="sm" />
        <span className="ml-2 text-xs text-muted-foreground hidden sm:inline">
          /{domain}
        </span>
      </Link>

      <div className="hidden sm:flex flex-1 justify-center max-w-sm mx-auto">
        <GlobalSearchTrigger />
      </div>

      <div className="flex items-center gap-2">
        <ConnectionStatus />
        <AlertsDropdown />
        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-12 w-12 rounded-full">
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
              {canSeeProfile() && (
                <>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </>
              )}
            </DropdownMenuItem>
            {hasRole("super_admin") && canSeeSettings() && (
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
    </header>
  );
});

export default Navbar;
