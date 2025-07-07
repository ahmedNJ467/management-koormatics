import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Globe, Bell, Shield } from "lucide-react";
import { Link } from "react-router-dom";

const settingsSections = [
  {
    title: "Company",
    icon: Building2,
    description: "Company profile, logo, and legal info",
    link: "/settings/company",
  },
  {
    title: "Regional",
    icon: Globe,
    description: "Locale, timezone & currency",
    link: "/settings/regional",
  },
  {
    title: "Notifications",
    icon: Bell,
    description: "Email, in-app & mobile notifications",
    link: "/settings/notifications",
  },
  {
    title: "Security & Access",
    icon: Shield,
    description: "Users, roles & permissions",
    link: "/settings/security",
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
        {settingsSections.map((section) => {
          const Wrapper: any = section.link ? Link : "div";
          return (
            <Wrapper to={section.link} key={section.title} className="block focus:outline-none">
              <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full">
                <CardHeader className="flex flex-row items-center gap-4">
                  <div className="rounded-md bg-secondary/20 p-3">
                    <section.icon className="h-6 w-6 text-secondary" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold">{section.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pb-4">
                  <p className="text-sm text-muted-foreground mb-6 min-h-[40px]">
                    {section.description}
                  </p>
                  {section.link && (
                    <Button variant="secondary" className="w-full">
                      Manage
                    </Button>
                  )}
                </CardContent>
              </Card>
            </Wrapper>
          );
        })}
      </div>
    </div>
  );
}
