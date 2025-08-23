import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings as SettingsIcon, Bell, Shield, Database, Palette, Globe } from "lucide-react";
import { useRole } from "@/hooks/useRole";

const settingsSections = [
  {
    title: "Notifications",
    description: "Email, in-app & mobile notifications",
    link: "/settings/notifications",
  },
  {
    title: "Security & Access",
    description: "Users, roles & permissions",
    link: "/settings/security",
  },
];

export default function Settings() {
  const { hasRole } = useRole();
  if (!hasRole("super_admin")) {
    // Non super admins should never land here (nav hides it), but guard route too
    return null;
  }
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Settings</h2>
        <p className="text-sm text-muted-foreground">
          Manage your application settings
        </p>
      </div>

      <div className="rounded-md border divide-y bg-background/50">
        {settingsSections.map((section) => (
          <Link
            key={section.title}
            href={section.link}
            className="block px-4 py-3 hover:bg-muted/40 focus:outline-none focus:ring-1 focus:ring-muted-foreground/20"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
              <span className="text-sm font-medium">{section.title}</span>
              <span className="text-xs text-muted-foreground">
                {section.description}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
