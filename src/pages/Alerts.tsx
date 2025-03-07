
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertsList } from "@/components/alerts/AlertsList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Alerts() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Alerts</h1>
        <p className="text-muted-foreground">
          Monitor and manage system alerts and notifications.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Alerts</CardTitle>
          <CardDescription>
            View and manage alerts related to vehicles, trips, and maintenance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Alerts</TabsTrigger>
              <TabsTrigger value="critical">Critical</TabsTrigger>
              <TabsTrigger value="warning">Warning</TabsTrigger>
              <TabsTrigger value="info">Info</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all">
              <AlertsList />
            </TabsContent>
            
            <TabsContent value="critical">
              <AlertsList filterPriority="high" />
            </TabsContent>
            
            <TabsContent value="warning">
              <AlertsList filterPriority="medium" />
            </TabsContent>
            
            <TabsContent value="info">
              <AlertsList filterPriority="low" />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
