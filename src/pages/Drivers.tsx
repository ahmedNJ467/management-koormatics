
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DriverFormDialog } from "@/components/driver-form-dialog";
import type { Driver } from "@/lib/types";

export default function Drivers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddingDriver, setIsAddingDriver] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | undefined>();

  const { data: drivers, isLoading, error } = useQuery({
    queryKey: ["drivers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("drivers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        toast({
          title: "Error fetching drivers",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }

      return data as Driver[];
    },
  });

  // Subscribe to real-time changes
  useEffect(() => {
    const channel = supabase
      .channel('drivers-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'drivers' }, 
        () => {
          // Refetch drivers when there are changes
          queryClient.invalidateQueries({ queryKey: ["drivers"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const handleDriverClick = (driver: Driver) => {
    setSelectedDriver(driver);
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">Drivers</h2>
            <p className="text-muted-foreground">Loading drivers...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">Error</h2>
          <p className="text-destructive">Failed to load drivers</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">Drivers</h2>
          <p className="text-muted-foreground">Manage your fleet drivers</p>
        </div>
        <Button onClick={() => setIsAddingDriver(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Driver
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {drivers?.map((driver) => (
          <Card 
            key={driver.id} 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleDriverClick(driver)}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-secondary/10 flex items-center justify-center">
                  {driver.avatar_url ? (
                    <img
                      src={driver.avatar_url}
                      alt={driver.name}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-lg font-semibold text-secondary">
                      {driver.name.split(" ").map(n => n[0]).join("")}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold">{driver.name}</h3>
                  <p className="text-sm text-muted-foreground">{driver.contact}</p>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">License:</span>
                  <span>{driver.license_number}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Type:</span>
                  <span>{driver.license_type}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Expiry:</span>
                  <span>{new Date(driver.license_expiry).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status:</span>
                  <span className={
                    driver.status === "active" 
                      ? "text-green-600" 
                      : driver.status === "on_leave" 
                        ? "text-yellow-600"
                        : "text-red-600"
                  }>
                    {driver.status.replace("_", " ")}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <DriverFormDialog 
        open={isAddingDriver || !!selectedDriver} 
        onOpenChange={(open) => {
          setIsAddingDriver(open);
          if (!open) setSelectedDriver(undefined);
        }}
        driver={selectedDriver}
      />
    </div>
  );
}
