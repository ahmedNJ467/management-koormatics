import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Home,
  LayoutDashboard,
  Settings,
  Menu,
  AlertTriangle,
  Car,
  Fuel,
  Wrench,
  TrendingUp,
  Users,
  Calendar,
  BarChart2,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  mobile?: boolean;
}

export function Sidebar({ sidebarOpen, setSidebarOpen, mobile = false }: SidebarProps) {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const sidebarLinks = [
    {
      title: "Dashboard",
      href: "/",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      title: "Alerts",
      href: "/alerts",
      icon: <AlertTriangle className="h-5 w-5" />,
    },
    {
      title: "Vehicles",
      href: "/vehicles",
      icon: <Car className="h-5 w-5" />,
    },
    {
      title: "Fuel Logs",
      href: "/fuel",
      icon: <Fuel className="h-5 w-5" />,
    },
    {
      title: "Maintenance",
      href: "/maintenance",
      icon: <Wrench className="h-5 w-5" />,
    },
    {
      title: "Reports",
      href: "/reports",
      icon: <TrendingUp className="h-5 w-5" />,
    },
    {
      title: "Drivers",
      href: "/drivers",
      icon: <Users className="h-5 w-5" />,
    },
    {
      title: "Trips",
      href: "/trips",
      icon: <Calendar className="h-5 w-5" />,
    },
    {
      title: "Trip Analytics",
      href: "/trip-analytics",
      icon: <BarChart2 className="h-5 w-5" />,
    },
  ];

  return (
    <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <SheetTrigger asChild={mobile}>
        <Button
          variant="ghost"
          size="sm"
          className="p-0 data-[state=open]:bg-transparent data-[state=open]:hover:no-underline"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 border-r p-0">
        <SheetHeader className="px-6 pt-6">
          <SheetTitle>Fleet Manager</SheetTitle>
          <SheetDescription>
            Manage your fleet and track your vehicles.
          </SheetDescription>
        </SheetHeader>
        <Separator className="my-4" />
        <div className="flex flex-col space-y-1 py-1">
          {sidebarLinks.map((link) => (
            <NavLink
              key={link.title}
              to={link.href}
              className={({ isActive }) =>
                `flex items-center gap-3 px-6 py-2 text-sm font-medium transition-colors hover:bg-secondary hover:text-accent-foreground ${
                  isActive ? "bg-secondary text-accent-foreground" : "text-muted-foreground"
                }`
              }
            >
              {link.icon}
              {link.title}
            </NavLink>
          ))}
        </div>
        <Separator className="my-4" />
        <div className="mt-auto px-6 pb-6">
          <Button variant="outline" className="w-full justify-start gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
