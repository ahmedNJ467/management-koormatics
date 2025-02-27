
import { Link, useLocation } from "react-router-dom";
import { 
  BookOpenText,
  FileEdit,
  FileText,
  FolderSync,
  Fuel,
  GaugeCircle,
  Map,
  Receipt,
  Settings,
  Truck,
  User,
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";

interface SidebarItemProps {
  to: string;
  icon: React.ReactNode;
  text: string;
  isMobile: boolean;
  isActive: boolean;
}

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

const SidebarItem = ({ to, icon, text, isMobile, isActive }: SidebarItemProps) => (
  <Link
    to={to}
    className={cn(
      "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
      isActive ? "bg-muted font-medium text-primary" : "text-muted-foreground",
      isMobile ? "justify-center" : ""
    )}
  >
    {icon}
    {!isMobile && <span>{text}</span>}
  </Link>
);

export function Sidebar({ open = true, onClose }: SidebarProps) {
  const location = useLocation();
  const isMobile = useIsMobile();

  const isActivePath = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <aside className={cn(
      "fixed inset-y-0 left-0 z-20 h-full flex-col border-r bg-background transition-transform duration-300",
      open ? "translate-x-0" : "-translate-x-full",
      isMobile ? "block" : "hidden md:flex"
    )}>
      <ScrollArea className="flex-1 px-4 py-6">
        <div className={cn("flex flex-col gap-2", isMobile ? "items-center" : "")}>
          <SidebarItem
            to="/"
            icon={<GaugeCircle className="h-5 w-5" />}
            text="Dashboard"
            isMobile={isMobile}
            isActive={isActivePath("/")}
          />
          <SidebarItem
            to="/vehicles"
            icon={<Truck className="h-5 w-5" />}
            text="Vehicles"
            isMobile={isMobile}
            isActive={isActivePath("/vehicles")}
          />
          <SidebarItem
            to="/drivers"
            icon={<User className="h-5 w-5" />}
            text="Drivers"
            isMobile={isMobile}
            isActive={isActivePath("/drivers")}
          />
          <SidebarItem
            to="/maintenance"
            icon={<FolderSync className="h-5 w-5" />}
            text="Maintenance"
            isMobile={isMobile}
            isActive={isActivePath("/maintenance")}
          />
          <SidebarItem
            to="/fuel-logs"
            icon={<Fuel className="h-5 w-5" />}
            text="Fuel Logs"
            isMobile={isMobile}
            isActive={isActivePath("/fuel-logs")}
          />
          <SidebarItem
            to="/clients"
            icon={<Users className="h-5 w-5" />}
            text="Clients"
            isMobile={isMobile}
            isActive={isActivePath("/clients")}
          />
          <SidebarItem
            to="/quotations"
            icon={<FileEdit className="h-5 w-5" />}
            text="Quotations"
            isMobile={isMobile}
            isActive={isActivePath("/quotations")}
          />
          <SidebarItem
            to="/invoices"
            icon={<Receipt className="h-5 w-5" />}
            text="Invoices"
            isMobile={isMobile}
            isActive={isActivePath("/invoices")}
          />
          <SidebarItem
            to="/trips"
            icon={<Map className="h-5 w-5" />}
            text="Trips"
            isMobile={isMobile}
            isActive={isActivePath("/trips")}
          />
          <SidebarItem
            to="/settings"
            icon={<Settings className="h-5 w-5" />}
            text="Settings"
            isMobile={isMobile}
            isActive={isActivePath("/settings")}
          />
        </div>
      </ScrollArea>
    </aside>
  );
}
