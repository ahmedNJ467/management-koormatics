
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertsList } from "@/components/alerts/AlertsList";
import { ImprovedAlertsTab } from "@/components/dashboard/ImprovedAlertsTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Bell } from "lucide-react";

export default function Alerts() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Enhanced Header */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-red-600/10 via-orange-600/10 to-amber-600/10 rounded-2xl"></div>
          <div className="relative p-8 rounded-2xl border border-white/20 bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 bg-clip-text text-transparent">
                  System Alerts
                </h1>
                <p className="text-lg text-muted-foreground">
                  Monitor and manage critical notifications and warnings
                </p>
              </div>
              <div className="hidden md:flex items-center space-x-4">
                <div className="flex items-center space-x-2 px-4 py-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-medium text-red-700 dark:text-red-400">Active Monitoring</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid gap-8 lg:grid-cols-12">
          {/* System Alerts - Enhanced */}
          <div className="lg:col-span-6">
            <Card className="border-0 shadow-xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-md overflow-hidden h-fit">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-orange-500/5"></div>
              <CardHeader className="relative pb-4 border-b border-gray-200/20 dark:border-gray-700/20">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl shadow-lg">
                    <AlertTriangle className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                      System Alerts
                    </CardTitle>
                    <CardDescription className="text-base">
                      Critical notifications & warnings
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="relative p-6">
                <div className="max-h-[600px] overflow-y-auto space-y-1">
                  <ImprovedAlertsTab />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* All Alerts Management */}
          <div className="lg:col-span-6">
            <Card className="border-0 shadow-xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-md overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5"></div>
              <CardHeader className="relative pb-4 border-b border-gray-200/20 dark:border-gray-700/20">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl shadow-lg">
                    <Bell className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                      All Alerts
                    </CardTitle>
                    <CardDescription className="text-base">
                      Comprehensive alert management and filtering
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="relative p-6">
                <Tabs defaultValue="all" className="w-full">
                  <TabsList className="mb-4 bg-white/50 dark:bg-gray-800/50">
                    <TabsTrigger value="all">All Alerts</TabsTrigger>
                    <TabsTrigger value="critical">Critical</TabsTrigger>
                    <TabsTrigger value="warning">Warning</TabsTrigger>
                    <TabsTrigger value="info">Info</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="all" className="max-h-[500px] overflow-y-auto">
                    <AlertsList />
                  </TabsContent>
                  
                  <TabsContent value="critical" className="max-h-[500px] overflow-y-auto">
                    <AlertsList filterPriority="high" />
                  </TabsContent>
                  
                  <TabsContent value="warning" className="max-h-[500px] overflow-y-auto">
                    <AlertsList filterPriority="medium" />
                  </TabsContent>
                  
                  <TabsContent value="info" className="max-h-[500px] overflow-y-auto">
                    <AlertsList filterPriority="low" />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
