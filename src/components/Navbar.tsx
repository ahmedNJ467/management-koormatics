import React, { useState, useEffect, useCallback, memo } from "react";
import { Menu, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import { AlertsDropdown } from "./alerts/AlertsDropdown";
import { useProfile } from "@/hooks/use-profile";
import { useAuth } from "@/hooks/useAuth";
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
import { usePageAccess } from "@/hooks/use-page-access";
import { useTheme } from "next-themes";
import { useToast } from "@/hooks/use-toast";
import { useRole } from "@/hooks/useRole";
import KoormaticsLogo from "@/components/ui/koormatics-logo";

interface NavbarProps {
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
}

let navbarMountedRef = false;
let cachedAvatarSrc: string | null = null;
let cachedAvatarInitials = "AD";

const getInitials = (name?: string | null) => {
  if (!name) return cachedAvatarInitials;
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
  return initials || cachedAvatarInitials;
};

const Navbar = memo(function Navbar({
  onToggleSidebar,
  sidebarOpen,
}: NavbarProps) {
  const { profile } = useProfile();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(() => navbarMountedRef);
  const router = useRouter();
  const { toast } = useToast();
  const { domain } = useTenantScope();
  const { hasRole } = useRole();
  const { data: pages = [] } = usePageAccess();
  const { signOut } = useAuth();
  const [avatarSrc, setAvatarSrc] = useState<string | null>(
    () => cachedAvatarSrc
  );
  const [avatarInitials, setAvatarInitials] = useState<string>(
    () => cachedAvatarInitials
  );

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
    return "/dashboard";
  }, []);

  const canSeeDashboard = useCallback(() => {
    const dashboardPath = dashboardPathByDomain();
    return isPageAllowed(dashboardPath) || isPageAllowed("/dashboard");
  }, [dashboardPathByDomain, isPageAllowed]);

  const canSeeProfile = useCallback(
    () => isPageAllowed("/profile"),
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
    if (!navbarMountedRef) {
      navbarMountedRef = true;
      setMounted(true);
    }
  }, []);

  useEffect(() => {
    if (!profile) {
      // Keep showing the previously cached avatar while profile reloads
      return;
    }

    const imageUrl = profile.profile_image_url;

    if (imageUrl) {
      if (cachedAvatarSrc !== imageUrl) {
        cachedAvatarSrc = imageUrl;
      }
      setAvatarSrc((previous) =>
        previous === imageUrl ? previous : imageUrl
      );
    } else {
      if (cachedAvatarSrc !== null) {
        cachedAvatarSrc = null;
      }
      setAvatarSrc((previous) => (previous === null ? previous : null));
    }
  }, [profile]);

  useEffect(() => {
    if (!profile) {
      return;
    }

    if (profile.name) {
      const initials = getInitials(profile.name);
      cachedAvatarInitials = initials;
      setAvatarInitials(initials);
    } else if (
      cachedAvatarInitials &&
      avatarInitials !== cachedAvatarInitials
    ) {
      setAvatarInitials(cachedAvatarInitials);
    }
  }, [profile, avatarInitials]);

  const handleProfileClick = useCallback(() => {
    router.push("/profile");
  }, [router]);

  const handleLogoutClick = useCallback(async () => {
    try {
      // Use the centralized logout from useAuth to prevent conflicts
      await signOut();

      // Show immediate success message
      toast({
        title: "Logged out successfully",
        description: "You have been signed out of the system",
      });

      // Immediately redirect to auth page
      router.push("/auth");
    } catch (error) {
      console.error("Logout error:", error);

      // Fallback: clear only our custom key and redirect
      try {
        localStorage.removeItem("supabase.auth.token");
      } catch {
        // Ignore localStorage errors
      }
      try {
        sessionStorage.removeItem("supabase.auth.token");
      } catch {
        // Ignore sessionStorage errors
      }

      toast({
        title: "Logout completed",
        description: "Redirecting to login page",
      });

      router.push("/auth");
    }
  }, [router, toast, signOut]);

  return (
    <header className="h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Left section - Menu and Logo */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className="h-9 w-9 hover:bg-muted/50"
          >
            <Menu className="h-4 w-4" />
          </Button>

          <Link
            href={homePath()}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <KoormaticsLogo size="sm" sticky />
            <span className="text-sm font-medium text-muted-foreground">
              {domain}
            </span>
          </Link>
        </div>

        {/* Right section - Actions and Profile */}
        <div className="flex items-center gap-3">
          <AlertsDropdown />
          <ThemeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-9 w-9 rounded-full hover:bg-muted/50 p-0"
              >
                <Avatar className="h-8 w-8">
                  {avatarSrc ? (
                    <AvatarImage src={avatarSrc} alt="Profile" />
                  ) : null}
                  <AvatarFallback className="text-xs">
                    {avatarInitials}
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
              {canSeeProfile() && (
                <DropdownMenuItem onClick={handleProfileClick}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
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
});

export default Navbar;