import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  BarChart3,
  Car,
  Settings,
  Users,
  Wrench,
  Fuel,
  Users2,
  FileText,
  Calendar,
  Receipt,
  BarChart,
  AlertTriangle,
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
import { useState } from "react";

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
      { name: "Trips", href: "/trips", icon: Calendar },
      { name: "Vehicle Leasing", href: "/vehicle-leasing", icon: CreditCard },
      { name: "Clients", href: "/clients", icon: Users2 },
      { name: "Contracts", href: "/contracts", icon: File },
      { name: "Quotations", href: "/quotations", icon: FileText },
      { name: "Invoices", href: "/invoices", icon: Receipt },
      { name: "Invitation Letter", href: "/invitation-letter", icon: Mail },
    ],
  },
  {
    category: "Analytics",
    items: [
      {
        name: "Revenue & Cost Analytics",
        href: "/cost-analytics",
        icon: DollarSign,
      },
      { name: "Reports", href: "/reports", icon: BarChart },
    ],
  },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const location = useLocation();
  const isMobile = useIsMobile();

  // Find which category contains the current route and set it as default expanded
  const findActiveCategoryIndex = () => {
    const activeIndex = navigationGroups.findIndex((group) =>
      group.items.some((item) => location.pathname === item.href)
    );
    return activeIndex !== -1 ? activeIndex : 0; // Default to first category if no match
  };

  const [expandedCategoryIndex, setExpandedCategoryIndex] = useState<
    number | null
  >(findActiveCategoryIndex());

  const handleLinkClick = () => {
    if (isMobile && open) {
      onClose();
    }
  };

  const toggleCategory = (categoryIndex: number) => {
    // If clicking on the already expanded category, collapse it
    // Otherwise, expand the clicked category (and collapse others)
    setExpandedCategoryIndex(
      expandedCategoryIndex === categoryIndex ? null : categoryIndex
    );
  };

  const isDashboardActive = location.pathname === "/dashboard";

  return (
    <aside
      className={cn(
        "fixed top-16 h-[calc(100vh-4rem)] w-64 border-r bg-background transition-transform duration-300 ease-in-out z-30 overflow-y-auto shadow-lg",
        !open && "-translate-x-full"
      )}
    >
      <nav className="flex flex-col gap-1 p-4">
        {/* Dashboard standalone item */}
        <div className="mb-4">
          <Link
            to="/dashboard"
            onClick={handleLinkClick}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200",
              isDashboardActive
                ? "bg-primary/10 text-primary font-medium border-l-2 border-primary ml-1"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </Link>
        </div>

        {navigationGroups.map((group, groupIndex) => {
          const isExpanded = expandedCategoryIndex === groupIndex;
          const hasActiveItem = group.items.some(
            (item) => location.pathname === item.href
          );

          return (
            <div key={group.category} className="mb-2">
              <button
                onClick={() => toggleCategory(groupIndex)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors hover:bg-muted",
                  hasActiveItem
                    ? "text-primary bg-primary/10"
                    : "text-foreground"
                )}
              >
                <span>{group.category}</span>
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>

              {isExpanded && (
                <div className="ml-2 pl-2 border-l border-muted mt-1 space-y-1">
                  {group.items.map((item) => {
                    const isActive = location.pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        onClick={handleLinkClick}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200",
                          isActive
                            ? "bg-primary/10 text-primary font-medium border-l-2 border-primary ml-1"
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                        {item.name}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
