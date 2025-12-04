import React, { useState, useEffect, useCallback, memo, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTenantScope } from "@/hooks/use-tenant-scope";
import { AppDomain } from "@/utils/subdomain";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Car,
  Users,
  Wrench,
  Fuel,
  Users2,
  FileText,
  Calendar,
  Receipt,
  BarChart,
  DollarSign,
  File,
  Package,
  ChevronDown,
  ChevronRight,
  Navigation,
  Mail,
  MessageCircle,
  Shield,
  CreditCard,
  Settings,
  Wallet,
} from "lucide-react";
import { usePageAccess } from "@/hooks/use-page-access";

// Navigation structure with categories
const navigationGroups = [
  {
    category: "Fleet Management",
    items: [
      { name: "Vehicles", href: "/vehicles", icon: Car },
      { name: "Drivers", href: "/drivers", icon: Users },
      { name: "Maintenance", href: "/maintenance", icon: Wrench },
      { name: "Fuel Logs", href: "/fuel-logs", icon: Fuel },
      { name: "Spare Parts", href: "/spare-parts", icon: Package },
      {
        name: "Vehicle Inspections",
        href: "/vehicle-inspections",
        icon: FileText,
      },
      {
        name: "Incident Reports",
        href: "/vehicle-incident-reports",
        icon: Shield,
      },
    ],
  },
  {
    category: "Operations",
    items: [
      { name: "Dispatch", href: "/dispatch", icon: Navigation },
      { name: "Chat", href: "/chat", icon: MessageCircle },
      { name: "Security Escorts", href: "/security-escorts", icon: Shield },
      { name: "Trips", href: "/trips", icon: Calendar },
      { name: "Clients", href: "/clients", icon: Users2 },
      { name: "Invitation Letter", href: "/invitation-letter", icon: Mail },
    ],
  },
  {
    category: "Finance",
    items: [
      {
        name: "Analytics",
        href: "/cost-analytics",
        icon: DollarSign,
      },
      { name: "Reports", href: "/reports", icon: BarChart },
      { name: "Vehicle Leasing", href: "/vehicle-leasing", icon: CreditCard },
      { name: "Contracts", href: "/contracts", icon: File },
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
      // Force a new Set instance to ensure React detects the change
      return new Set(newSet);
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
  // Run on mount and when pathname changes to restore state after refresh
  useEffect(() => {
    if (!pathname) return;
    
    const categoriesToExpand = new Set<string>();
    navigationGroups.forEach((group) => {
      const hasActiveItem = group.items.some(
        (item) => pathname === item.href
      );
      if (hasActiveItem) {
        categoriesToExpand.add(group.category);
      }
    });
    
    // Always update state to ensure categories are expanded, even if Set appears unchanged
    if (categoriesToExpand.size > 0) {
      setExpandedCategories((prev) => {
        // Check if we need to update
        const needsUpdate = Array.from(categoriesToExpand).some(
          (cat) => !prev.has(cat)
        );
        if (!needsUpdate) return prev; // Return same reference if no change needed
        
        const newSet = new Set(prev);
        categoriesToExpand.forEach((cat) => newSet.add(cat));
        return newSet;
      });
    }
  }, [pathname]);

  // Get all visible items for keyboard navigation
  const allVisibleItems = useMemo(() => {
    const items: Array<{ href: string; name: string }> = [];
    navigationGroups.forEach((group) => {
      group.items.forEach((item) => {
        if (item?.href && shouldShowItem(item.href) && hasAccess(item.href)) {
          items.push({ href: item.href, name: item.name });
        }
      });
    });
    return items;
  }, [shouldShowItem, hasAccess]);

  return (
    <div className="flex h-full flex-col bg-background border-r">
      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-4" aria-label="Main navigation">
        {/* Dashboard - Single link, no menu */}
        <Link
          href="/dashboard"
          className={cn(
            "flex items-center space-x-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
            pathname === "/dashboard"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-accent"
          )}
          prefetch={true}
          onClick={handleLinkClick}
          aria-current={pathname === "/dashboard" ? "page" : undefined}
        >
          <BarChart className="h-4 w-4 flex-shrink-0" />
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
                          "flex items-center space-x-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                          isActive
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent"
                        )}
                        prefetch={true}
                        onMouseEnter={
                          item.href === "/vehicles" ? prefetchVehicles : undefined
                        }
                        onClick={handleLinkClick}
                        aria-current={isActive ? "page" : undefined}
                      >
                        <item.icon className="h-4 w-4 flex-shrink-0" />
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
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleCategory(group.category);
                }}
                className="flex w-full items-center justify-between px-2 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent"
                aria-expanded={isExpanded}
                aria-controls={`category-${group.category}`}
              >
                <span>{group.category}</span>
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 transition-transform" />
                ) : (
                  <ChevronRight className="h-4 w-4 transition-transform" />
                )}
              </button>

              {isExpanded && (
                <div 
                  id={`category-${group.category}`}
                  className="ml-4 space-y-1"
                  role="group"
                  aria-label={`${group.category} navigation items`}
                >
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
                            "flex items-center space-x-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                            isActive
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground hover:bg-accent"
                          )}
                          prefetch={true}
                          onMouseEnter={
                            item.href === "/vehicles"
                              ? prefetchVehicles
                              : undefined
                          }
                          onClick={handleLinkClick}
                          aria-current={isActive ? "page" : undefined}
                        >
                          <item.icon className="h-4 w-4 flex-shrink-0" />
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