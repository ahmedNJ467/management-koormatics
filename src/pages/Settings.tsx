
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Globe, Bell, Shield } from "lucide-react";

const settingsSections = [
  {
    title: "Company Information",
    icon: Building2,
    description: "Manage your company details and business information",
  },
  {
    title: "Regional Settings",
    icon: Globe,
    description: "Configure timezone, currency, and language preferences",
  },
  {
    title: "Notifications",
    icon: Bell,
    description: "Set up email and system notification preferences",
  },
  {
    title: "Security & Access",
    icon: Shield,
    description: "Manage user roles, permissions, and security settings",
  },
];

export default function Settings() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-3xl font-semibold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">Manage your application settings</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {settingsSections.map((section) => (
          <Card key={section.title} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="rounded-lg bg-secondary/10 p-2">
                <section.icon className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <CardTitle className="text-lg">{section.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {section.description}
              </p>
              <Button variant="outline" className="w-full">
                Configure
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
