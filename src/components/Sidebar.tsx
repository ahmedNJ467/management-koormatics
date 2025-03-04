
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
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: BarChart3 },
  { name: "Vehicles", href: "/vehicles", icon: Car },
  { name: "Drivers", href: "/drivers", icon: Users },
  { name: "Maintenance", href: "/maintenance", icon: Wrench },
  { name: "Fuel Logs", href: "/fuel-logs", icon: Fuel },
  { name: "Spare Parts", href: "/spare-parts", icon: Package },
  { name: "Clients", href: "/clients", icon: Users2 },
  { name: "Contracts", href: "/contracts", icon: File },
  { name: "Quotations", href: "/quotations", icon: FileText },
  { name: "Invoices", href: "/invoices", icon: Receipt },
  { name: "Trips", href: "/trips", icon: Calendar },
  { name: "Cost Analytics", href: "/cost-analytics", icon: DollarSign },
  { name: "Reports", href: "/reports", icon: BarChart },
  { name: "Alerts", href: "/alerts", icon: AlertTriangle },
  { name: "Settings", href: "/settings", icon: Settings },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const location = useLocation();
  const isMobile = useIsMobile();

  const handleLinkClick = () => {
    if (isMobile && open) {
      onClose();
    }
  };

  return (
    <aside
      className={cn(
        "fixed top-16 h-[calc(100vh-4rem)] w-64 border-r bg-background transition-transform duration-300 ease-in-out z-30",
        !open && "-translate-x-full"
      )}
    >
      <nav className="flex flex-col gap-1 p-4">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={handleLinkClick}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
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
      </nav>
    </aside>
  );
}
