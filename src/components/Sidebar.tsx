import React, { useState, useEffect, useCallback, memo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTenantScope } from "@/hooks/use-tenant-scope";
import { AppDomain } from "@/utils/subdomain";

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
  Shield,
  CreditCard,
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
        name: "Revenue & Cost Analytics",
        href: "/cost-analytics",
        icon: DollarSign,
      },
      { name: "Reports", href: "/reports", icon: BarChart },
      { name: "Vehicle Leasing", href: "/vehicle-leasing", icon: CreditCard },
      { name: "Contracts", href: "/contracts", icon: File },
      { name: "Quotations", href: "/quotations", icon: FileText },
      { name: "Invoices", href: "/invoices", icon: Receipt },
      { name: "Trip Finance", href: "/trip-finance", icon: Receipt },
    ],
  },
];

const DOMAIN_ITEM_ALLOWLIST: Record<AppDomain | "*", string[] | "*"> = {
  "*": "*",
  management: "*",
  fleet: [
    "/dashboard-management",
    "/vehicles",
    "/drivers",
    "/maintenance",
    "/fuel-logs",
    "/spare-parts",
    "/vehicle-inspections",
    "/vehicle-incident-reports",
  ],
  operations: [
    "/dashboard-management",
    "/dispatch",
    "/security-escorts",
    "/trips",
    "/clients",
    "/invitation-letter",
  ],
  finance: [
    "/dashboard-management",
    "/cost-analytics",
    "/reports",
    "/vehicle-leasing",
    "/contracts",
    "/quotations",
    "/invoices",
    "/trip-finance",
  ],
};

const Sidebar = memo(function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { domain } = useTenantScope();
  const isMobile = useIsMobile();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );
  const { data: pages = [], isLoading } = usePageAccess();

  // Function to check if user has access to a specific page
  const hasAccess = useCallback(
    (href: string) => {
      if (isLoading) return false;
      if (pages.includes("*")) return true;

      const pageId = href.startsWith("/") ? href.slice(1) : href;
      const firstSegment = pageId.split("/")[0] || pageId;

      return pages.includes(pageId) || pages.includes(firstSegment);
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
    (href: string) => {
      if (!domain) return false;
      const allowedItems = DOMAIN_ITEM_ALLOWLIST[domain];
      return allowedItems === "*" || allowedItems.includes(href);
    },
    [domain]
  );

  // Check if a category has any visible items
  const hasVisibleItems = useCallback(
    (items: (typeof navigationGroups)[0]["items"]) => {
      return items.some((item) => shouldShowItem(item.href));
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
          href="/dashboard-management"
          className={cn(
            "flex items-center space-x-3 px-3 py-2 text-sm rounded-md transition-colors",
            pathname === "/dashboard-management"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-accent"
          )}
          prefetch={true}
        >
          <BarChart className="h-4 w-4" />
          <span>Dashboard</span>
        </Link>

        {/* Other navigation categories */}
        {navigationGroups.map((group) => {
          // Only show categories that have visible items
          if (!hasVisibleItems(group.items)) return null;

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
                    .filter((item) => shouldShowItem(item.href))
                    .map((item) => {
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
