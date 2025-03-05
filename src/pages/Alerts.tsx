
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertsList } from "@/components/alerts/AlertsList";

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
          <AlertsList />
        </CardContent>
      </Card>
    </div>
  );
}
