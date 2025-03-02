
import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Car, UserPlus, MapPin, Wrench, Fuel, BarChart3, AlertTriangle, Users, FileText, Receipt, BarChart2, Settings, Home } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const [collapsed, setCollapsed] = useState(isMobile);

  const navItems = [
    { label: "Dashboard", icon: Home, path: "/dashboard" },
    { label: "Vehicles", icon: Car, path: "/vehicles" },
    { label: "Drivers", icon: UserPlus, path: "/drivers" },
    { label: "Trips", icon: MapPin, path: "/trips" },
    { label: "Maintenance", icon: Wrench, path: "/maintenance" },
    { label: "Fuel Logs", icon: Fuel, path: "/fuel-logs" },
    { label: "Cost Analytics", icon: BarChart3, path: "/cost-analytics" },
    { label: "Alerts", icon: AlertTriangle, path: "/alerts" },
    { label: "Clients", icon: Users, path: "/clients" },
    { label: "Quotations", icon: FileText, path: "/quotations" },
    { label: "Invoices", icon: Receipt, path: "/invoices" },
    { label: "Reports", icon: BarChart2, path: "/reports" },
    { label: "Settings", icon: Settings, path: "/settings" },
  ];

  return (
    <div className={`sidebar ${isOpen ? "open" : "closed"}`}>
      <button onClick={() => setCollapsed(!collapsed)} className="toggle-button">
        {collapsed ? "Expand" : "Collapse"}
      </button>
      <nav>
        <ul>
          {navItems.map(item => (
            <li key={item.path} className={location.pathname === item.path ? "active" : ""}>
              <a href={item.path}>
                <item.icon className="icon" />
                <span>{item.label}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};
