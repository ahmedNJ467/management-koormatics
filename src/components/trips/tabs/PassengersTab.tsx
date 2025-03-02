
import { Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DisplayTrip } from "@/lib/types/trip";

interface PassengersTabProps {
  viewTrip: DisplayTrip;
}

export function PassengersTab({ viewTrip }: PassengersTabProps) {
  // Ensure we're working with an array of passengers
  const passengers = Array.isArray(viewTrip.passengers) ? viewTrip.passengers : [];
  
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Users className="h-5 w-5 text-purple-400" />
        <h3 className="text-lg font-medium">Passengers</h3>
        <Badge variant="outline" className="bg-indigo-900/40 text-indigo-300">
          {passengers.length} {passengers.length === 1 ? 'Passenger' : 'Passengers'}
        </Badge>
      </div>
      
      {passengers.length > 0 ? (
        <Card className="bg-slate-900/50 border-slate-800/50">
          <CardContent className="p-4">
            <ul className="divide-y divide-slate-800/50">
              {passengers.map((passenger, index) => (
                <li key={index} className="py-3 flex items-center space-x-3">
                  <div className="flex-shrink-0 h-9 w-9 rounded-full bg-indigo-900/40 flex items-center justify-center text-indigo-300">
                    {passenger.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-200">{passenger}</p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : (
        <div className="text-center p-6 border border-dashed border-slate-800 rounded-lg">
          <Users className="mx-auto h-12 w-12 text-slate-700" />
          <h3 className="mt-2 text-sm font-medium text-slate-400">No passengers</h3>
          <p className="mt-1 text-sm text-slate-600">
            No passengers have been added to this trip.
          </p>
        </div>
      )}
    </div>
  );
}
