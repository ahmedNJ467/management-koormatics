import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Users, Shield, Database, Bell } from "lucide-react";

export default function ManagementSettings() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">System Settings</h1>
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Settings className="h-4 w-4" />
          <span>Management Department Only</span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>User Management</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Manage user accounts and permissions
              </p>
              <p className="text-sm">Total Users: 45</p>
              <p className="text-sm">Active Users: 42</p>
              <p className="text-sm">Last Updated: Today</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Security Settings</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Configure security policies
              </p>
              <p className="text-sm">2FA: Enabled</p>
              <p className="text-sm">Password Policy: Strong</p>
              <p className="text-sm">Last Audit: Yesterday</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="h-5 w-5" />
              <span>Database Settings</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Database configuration and maintenance
              </p>
              <p className="text-sm">Status: Online</p>
              <p className="text-sm">Backup: Daily</p>
              <p className="text-sm">Last Backup: 2 hours ago</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <span>Notification Settings</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Configure system notifications
              </p>
              <p className="text-sm">Email: Enabled</p>
              <p className="text-sm">SMS: Disabled</p>
              <p className="text-sm">Push: Enabled</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>System Configuration</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                General system settings
              </p>
              <p className="text-sm">Timezone: UTC+3</p>
              <p className="text-sm">Language: English</p>
              <p className="text-sm">Theme: Light</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
