import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Settings, Shield, Database, Key, Activity } from "lucide-react";

export default function ManagementSettings() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">System Settings</h1>
        <div className="text-sm text-muted-foreground">
          Management department only
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* User Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Manage user accounts, roles, and permissions across all
              departments.
            </div>
            <div className="space-y-2">
              <button className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm">
                Manage Users
              </button>
              <button className="w-full px-4 py-2 border border-border rounded-md text-sm">
                Role Permissions
              </button>
              <button className="w-full px-4 py-2 border border-border rounded-md text-sm">
                Access Control
              </button>
            </div>
          </CardContent>
        </Card>

        {/* System Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              System Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Configure system-wide settings and preferences.
            </div>
            <div className="space-y-2">
              <button className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm">
                General Settings
              </button>
              <button className="w-full px-4 py-2 border border-border rounded-md text-sm">
                Email Configuration
              </button>
              <button className="w-full px-4 py-2 border border-border rounded-md text-sm">
                Notification Settings
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Security & API */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security & API Keys
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Manage API keys, security settings, and access tokens.
            </div>
            <div className="space-y-2">
              <button className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm">
                API Key Management
              </button>
              <button className="w-full px-4 py-2 border border-border rounded-md text-sm">
                Security Policies
              </button>
              <button className="w-full px-4 py-2 border border-border rounded-md text-sm">
                Audit Logs
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Database & Analytics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database & Analytics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Database management and system analytics.
            </div>
            <div className="space-y-2">
              <button className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm">
                Database Status
              </button>
              <button className="w-full px-4 py-2 border border-border rounded-md text-sm">
                System Analytics
              </button>
              <button className="w-full px-4 py-2 border border-border rounded-md text-sm">
                Performance Metrics
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">Online</div>
              <div className="text-sm text-muted-foreground">Database</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">Online</div>
              <div className="text-sm text-muted-foreground">API Services</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">Online</div>
              <div className="text-sm text-muted-foreground">File Storage</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
