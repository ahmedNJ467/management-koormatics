
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
} from "lucide-react";
import { useState } from "react";

// Navigation structure with categories
const navigationGroups = [
  {
    category: "Overview",
    items: [
      { name: "Dashboard", href: "/", icon: BarChart3 },
    ]
  },
  {
    category: "Fleet Management",
    items: [
      { name: "Vehicles", href: "/vehicles", icon: Car },
      { name: "Drivers", href: "/drivers", icon: Users },
      { name: "Maintenance", href: "/maintenance", icon: Wrench },
      { name: "Fuel Logs", href: "/fuel-logs", icon: Fuel },
      { name: "Spare Parts", href: "/spare-parts", icon: Package },
    ]
  },
  {
    category: "Business",
    items: [
      { name: "Clients", href: "/clients", icon: Users2 },
      { name: "Contracts", href: "/contracts", icon: File },
      { name: "Quotations", href: "/quotations", icon: FileText },
      { name: "Invoices", href: "/invoices", icon: Receipt },
      { name: "Trips", href: "/trips", icon: Calendar },
    ]
  },
  {
    category: "Analytics & Reports",
    items: [
      { name: "Revenue & Cost Analytics", href: "/cost-analytics", icon: DollarSign },
      { name: "Reports", href: "/reports", icon: BarChart },
      { name: "Alerts", href: "/alerts", icon: AlertTriangle },
    ]
  },
  {
    category: "Administration",
    items: [
      { name: "Settings", href: "/settings", icon: Settings },
    ]
  }
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const location = useLocation();
  const isMobile = useIsMobile();
  const [expandedCategories, setExpandedCategories] = useState<string[]>(
    navigationGroups.map(group => group.category) // Start with all categories expanded
  );

  const handleLinkClick = () => {
    if (isMobile && open) {
      onClose();
    }
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(cat => cat !== category) 
        : [...prev, category]
    );
  };

  return (
    <aside
      className={cn(
        "fixed top-16 h-[calc(100vh-4rem)] w-64 border-r bg-background transition-transform duration-300 ease-in-out z-30 overflow-y-auto",
        !open && "-translate-x-full"
      )}
    >
      <nav className="flex flex-col gap-1 p-4">
        {navigationGroups.map((group) => {
          const isExpanded = expandedCategories.includes(group.category);
          const hasActiveItem = group.items.some(item => location.pathname === item.href);
          
          return (
            <div key={group.category} className="mb-2">
              <button
                onClick={() => toggleCategory(group.category)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                  hasActiveItem ? "text-secondary" : "text-foreground hover:bg-muted"
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
                <div className="ml-2 pl-2 border-l border-muted mt-1">
                  {group.items.map((item) => {
                    const isActive = location.pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        onClick={handleLinkClick}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors my-1",
                          isActive
                            ? "bg-secondary/10 text-secondary font-medium"
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        )}
                      >
                        <item.icon className="h-5 w-5" />
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
