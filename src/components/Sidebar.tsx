import React, { useState, useEffect, useCallback, memo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTenantScope } from "@/hooks/use-tenant-scope";
import { AppDomain } from "@/utils/subdomain";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Truck,
  UserCog,
  Settings as SettingsIcon,
  Droplet,
  Box,
  ClipboardCheck,
  ShieldAlert,
  Route,
  MessageSquare,
  CalendarDays,
  Building2,
  MailOpen,
  TrendingUp,
  ChartBar,
  CreditCard,
  FileText,
  Receipt,
  Wallet,
  Settings,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { usePageAccess } from "@/hooks/use-page-access";

// Navigation structure with categories
const navigationGroups = [
  {
    category: "Fleet Management",
    items: [
      { name: "Vehicles", href: "/vehicles", icon: Truck },
      { name: "Drivers", href: "/drivers", icon: UserCog },
      { name: "Maintenance", href: "/maintenance", icon: SettingsIcon },
      { name: "Fuel Logs", href: "/fuel-logs", icon: Droplet },
      { name: "Spare Parts", href: "/spare-parts", icon: Box },
      {
        name: "Vehicle Inspections",
        href: "/vehicle-inspections",
        icon: ClipboardCheck,
      },
      {
        name: "Incident Reports",
        href: "/vehicle-incident-reports",
        icon: ShieldAlert,
      },
    ],
  },
  {
    category: "Operations",
    items: [
      { name: "Dispatch", href: "/dispatch", icon: Route },
      { name: "Chat", href: "/chat", icon: MessageSquare },
      { name: "Security Escorts", href: "/security-escorts", icon: ShieldAlert },
      { name: "Trips", href: "/trips", icon: CalendarDays },
      { name: "Clients", href: "/clients", icon: Building2 },
      { name: "Invitation Letter", href: "/invitation-letter", icon: MailOpen },
    ],
  },
  {
    category: "Finance",
    items: [
      {
        name: "Analytics",
        href: "/cost-analytics",
        icon: TrendingUp,
      },
      { name: "Reports", href: "/reports", icon: ChartBar },
      { name: "Vehicle Leasing", href: "/vehicle-leasing", icon: CreditCard },
      { name: "Contracts", href: "/contracts", icon: FileText },
      { name: "Quotations", href: "/quotations", icon: FileText },
      { name: "Invoices", href: "/invoices", icon: Receipt },
      { name: "Trip Finance", href: "/trip-finance", icon: Receipt },
      { name: "Payroll", href: "/payroll", icon: Wallet },
    ],
  },
  {
    category: "System",
    items: [{ name: "Settings", href: "/settings", icon: Settings }],
  },
];

const DOMAIN_ITEM_ALLOWLIST: Record<AppDomain | "*", string[] | "*"> = {
  "*": "*",
  management: "*",
  fleet: [
    "/dashboard",
    "/vehicles",
    "/drivers",
    "/maintenance",
    "/fuel-logs",
    "/spare-parts",
    "/vehicle-inspections",
    "/vehicle-incident-reports",
    "/settings",
  ],
  operations: [
    "/dashboard",
    "/dispatch",
    "/chat",
    "/security-escorts",
    "/trips",
    "/clients",
    "/invitation-letter",
    "/settings",
  ],
  finance: [
    "/dashboard",
    "/cost-analytics",
    "/reports",
    "/vehicle-leasing",
    "/contracts",
    "/quotations",
    "/invoices",
    "/trip-finance",
    "/payroll",
    "/settings",
  ],
};

interface SidebarComponentProps {
  onLinkClick?: () => void;
}

const Sidebar = memo(function Sidebar({ onLinkClick }: SidebarComponentProps) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { domain } = useTenantScope();
  const isMobile = useIsMobile();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );
  const { data: pages = [], isLoading } = usePageAccess();

  // Handle link click to close sidebar on mobile
  const handleLinkClick = useCallback(() => {
    if (onLinkClick && isMobile) {
      onLinkClick();
    }
  }, [onLinkClick, isMobile]);

  // Prefetch vehicles data on hover for instant loading
  const prefetchVehicles = useCallback(() => {
    const cachedData = queryClient.getQueryData(["vehicles"]);
    if (!cachedData) {
      queryClient.prefetchQuery({
        queryKey: ["vehicles"],
        queryFn: async () => {
          const { data, error } = await supabase
            .from("vehicles")
            .select(
              "id, make, model, registration, type, status, year, color, vin, insurance_expiry, notes, created_at, updated_at, images"
            )
            .order("created_at", { ascending: false });
          if (error) throw error;
          return data || [];
        },
        staleTime: 30 * 60 * 1000,
      });
    }
  }, [queryClient]);

  // Function to check if user has access to a specific page
  const hasAccess = useCallback(
    (href?: string | null) => {
      if (!href || typeof href !== "string") return false;
      if (isLoading) return false;
      
      // Filter out any undefined/null values from pages array
      const validPages = (pages || []).filter((p): p is string => typeof p === "string" && p.length > 0);
      
      if (validPages.includes("*")) return true;

      const pageId = href.startsWith("/") ? href.slice(1) : href;
      if (!pageId || typeof pageId !== "string") return false;

      const firstSegment = pageId.split("/")[0] || pageId;
      if (!firstSegment || typeof firstSegment !== "string") return false;

      return validPages.includes(pageId) || validPages.includes(firstSegment);
    },
    [pages, isLoading]
  );

  // Function to toggle category expansion
  const toggleCategory = useCallback((category: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  }, []);

  // Check if a navigation item should be shown for the current domain
  const shouldShowItem = useCallback(
    (href?: string | null) => {
      if (!href || typeof href !== "string" || !domain) return false;
      const allowedItems = DOMAIN_ITEM_ALLOWLIST[domain];
      if (!allowedItems) return false;
      return allowedItems === "*" || (Array.isArray(allowedItems) && allowedItems.includes(href));
    },
    [domain]
  );

  // Check if a category has any visible items
  const hasVisibleItems = useCallback(
    (items: (typeof navigationGroups)[0]["items"]) => {
      return items.some((item) => item?.href && shouldShowItem(item.href));
    },
    [shouldShowItem]
  );

  // Auto-expand categories that contain the current active page
  useEffect(() => {
    if (pathname) {
      navigationGroups.forEach((group) => {
        const hasActiveItem = group.items.some(
          (item) => pathname === item.href
        );
        if (hasActiveItem) {
          setExpandedCategories((prev) => {
            const newSet = new Set(prev);
            newSet.add(group.category);
            return newSet;
          });
        }
      });
    }
  }, [pathname]);

  return (
    <div className="flex h-full flex-col bg-background border-r">
      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Dashboard - Single link, no menu */}
        <Link
          href="/dashboard"
          className={cn(
            "flex items-center space-x-3 px-3 py-2 text-sm rounded-md transition-colors",
            pathname === "/dashboard"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-accent"
          )}
          prefetch={true}
          onClick={handleLinkClick}
        >
          <ChartBar className="h-4 w-4" />
          <span>Dashboard</span>
        </Link>

        {/* Other navigation categories */}
        {navigationGroups.map((group) => {
          // Only show categories that have visible items
          if (!hasVisibleItems(group.items)) return null;

          // For fleet domain, show items directly without category header
          if (domain === "fleet" && group.category === "Fleet Management") {
            return (
              <div key={group.category} className="space-y-1">
                {group.items
                  .filter((item) => item?.href && shouldShowItem(item.href))
                  .map((item) => {
                    if (!item?.href) return null;
                    const isActive = pathname === item.href;
                    const hasPageAccess = hasAccess(item.href);

                    if (!hasPageAccess) return null;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center space-x-3 px-3 py-2 text-sm rounded-md transition-colors",
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent"
                        )}
                        prefetch={true}
                        onMouseEnter={
                          item.href === "/vehicles" ? prefetchVehicles : undefined
                        }
                        onClick={handleLinkClick}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
              </div>
            );
          }

          const isExpanded = expandedCategories.has(group.category);

          return (
            <div key={group.category} className="space-y-2">
              <button
                onClick={() => toggleCategory(group.category)}
                className="flex w-full items-center justify-between px-2 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent"
              >
                <span>{group.category}</span>
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>

              {isExpanded && (
                <div className="ml-4 space-y-1">
                  {group.items
                    .filter((item) => item?.href && shouldShowItem(item.href))
                    .map((item) => {
                      if (!item?.href) return null;
                      const isActive = pathname === item.href;
                      const hasPageAccess = hasAccess(item.href);

                      if (!hasPageAccess) return null;

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={cn(
                            "flex items-center space-x-3 px-3 py-2 text-sm rounded-md transition-colors",
                            isActive
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:text-foreground hover:bg-accent"
                          )}
                          prefetch={true}
                          onMouseEnter={
                            item.href === "/vehicles"
                              ? prefetchVehicles
                              : undefined
                          }
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.name}</span>
                        </Link>
                      );
                    })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
});

export default Sidebar;