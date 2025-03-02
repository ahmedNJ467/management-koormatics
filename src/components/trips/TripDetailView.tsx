
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { FileText, MessageCircle, UserCircle, MapPin, Calendar, Users } from "lucide-react";
import { DisplayTrip } from "@/lib/types/trip";
import { TripMessage } from "@/lib/types/trip/communication";
import { TripAssignment } from "@/lib/types/trip/communication";
import { MessagesTab } from "@/components/trips/tabs/MessagesTab";
import { AssignmentsTab } from "@/components/trips/tabs/AssignmentsTab";
import { DetailsTab } from "@/components/trips/tabs/DetailsTab";
import { PassengersTab } from "@/components/trips/tabs/PassengersTab";
import { TripDetailHeader } from "@/components/trips/TripDetailHeader";
import { TripDetailActions } from "@/components/trips/TripDetailActions";
import { Driver } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/components/trips/utils";
import { tripTypeDisplayMap } from "@/lib/types/trip/base-types";
import { QueryClient } from "@tanstack/react-query";

interface TripDetailViewProps {
  viewTrip: DisplayTrip;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  messages: TripMessage[];
  assignments: TripAssignment[];
  drivers: Driver[];
  newMessage: string;
  setNewMessage: (message: string) => void;
  handleSendMessage: () => Promise<void>;
  setTripToAssign: (trip: DisplayTrip) => void;
  setAssignOpen: (open: boolean) => void;
  setTripToMessage: (trip: DisplayTrip) => void;
  setMessageOpen: (open: boolean) => void;
  setEditTrip: (trip: DisplayTrip) => void;
  setTripToDelete: (id: string) => void;
  setDeleteDialogOpen: (open: boolean) => void;
  setViewTrip: (trip: DisplayTrip | null) => void;
  queryClient: QueryClient;
}

export function TripDetailView({ 
  viewTrip,
  activeTab,
  setActiveTab,
  messages,
  assignments,
  drivers,
  newMessage,
  setNewMessage,
  handleSendMessage,
  setTripToAssign,
  setAssignOpen,
  setTripToMessage,
  setMessageOpen,
  setEditTrip,
  setTripToDelete,
  setDeleteDialogOpen,
  setViewTrip,
  queryClient
}: TripDetailViewProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300';
      case 'in_progress': return 'bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300';
      case 'completed': return 'bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-300';
      case 'cancelled': return 'bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  // Check if this is an organization client trip
  const isOrganizationTrip = viewTrip.client_type === "organization";
  const hasPassengers = isOrganizationTrip && Array.isArray(viewTrip.passengers) && viewTrip.passengers.length > 0;

  // For debugging
  console.log("Trip in TripDetailView:", viewTrip);
  console.log("Is organization trip:", isOrganizationTrip);
  console.log("Passengers:", viewTrip.passengers);

  return (
    <div className="w-full">
      <div className="bg-gradient-to-r from-slate-900/50 to-indigo-950/50 dark:from-indigo-950/70 dark:to-purple-950/70 p-6 rounded-lg mb-6 border border-slate-800/50">
        <DialogTitle className="text-xl font-semibold mb-3 text-white flex items-center">
          <Calendar className="h-5 w-5 mr-2 text-purple-400" />
          {formatDate(viewTrip.date)}
          <span className="mx-2 text-slate-400">•</span>
          <MapPin className="h-5 w-5 mr-2 text-purple-400" />
          {viewTrip.pickup_location.split(',')[0]}
        </DialogTitle>
        
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <Badge variant="outline" className={`font-medium ${getStatusColor(viewTrip.status)}`}>
            {viewTrip.status.replace('_', ' ').toUpperCase()}
          </Badge>
          <Badge variant="outline" className="bg-indigo-900/40 text-indigo-300 hover:bg-indigo-900/40 border-indigo-700">
            {tripTypeDisplayMap[viewTrip.type]}
          </Badge>
          {isOrganizationTrip && (
            <Badge variant="outline" className="bg-purple-900/40 text-purple-300 hover:bg-purple-900/40 border-purple-700">
              Organization
            </Badge>
          )}
          {hasPassengers && (
            <Badge variant="outline" className="bg-teal-900/40 text-teal-300 hover:bg-teal-900/40 border-teal-700">
              {viewTrip.passengers?.length} {viewTrip.passengers?.length === 1 ? 'Passenger' : 'Passengers'}
            </Badge>
          )}
        </div>
        
        <DialogDescription className="text-sm text-slate-400 mb-2">
          Trip ID: {viewTrip.id.substring(0, 8).toUpperCase()}
        </DialogDescription>
      </div>

      <TripDetailHeader viewTrip={viewTrip} />
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">
        <TabsList className="w-full bg-slate-900/50 dark:bg-slate-800/30 p-1 border border-slate-800/50 rounded-md">
          <TabsTrigger value="details" className="flex-1 text-slate-300 data-[state=active]:bg-indigo-900/30 data-[state=active]:text-purple-300">
            <FileText className="h-4 w-4 mr-2" />
            Details
          </TabsTrigger>
          {isOrganizationTrip && (
            <TabsTrigger value="passengers" className="flex-1 text-slate-300 data-[state=active]:bg-indigo-900/30 data-[state=active]:text-purple-300">
              <Users className="h-4 w-4 mr-2" />
              Passengers
            </TabsTrigger>
          )}
          <TabsTrigger value="messages" className="flex-1 text-slate-300 data-[state=active]:bg-indigo-900/30 data-[state=active]:text-purple-300">
            <MessageCircle className="h-4 w-4 mr-2" />
            Messages
          </TabsTrigger>
          <TabsTrigger value="assignments" className="flex-1 text-slate-300 data-[state=active]:bg-indigo-900/30 data-[state=active]:text-purple-300">
            <UserCircle className="h-4 w-4 mr-2" />
            Assignments
          </TabsTrigger>
        </TabsList>
        <TabsContent value="details" className="space-y-4 mt-4">
          <DetailsTab viewTrip={viewTrip} />
        </TabsContent>
        {isOrganizationTrip && (
          <TabsContent value="passengers" className="space-y-4 mt-4">
            <PassengersTab viewTrip={viewTrip} setViewTrip={setViewTrip} queryClient={queryClient} />
          </TabsContent>
        )}
        <TabsContent value="messages" className="space-y-4 mt-4">
          <MessagesTab 
            messages={messages}
            newMessage={newMessage}
            setNewMessage={setNewMessage}
            handleSendMessage={handleSendMessage}
          />
        </TabsContent>
        <TabsContent value="assignments" className="space-y-4 mt-4">
          <AssignmentsTab 
            viewTrip={viewTrip}
            assignments={assignments}
            drivers={drivers}
            setTripToAssign={setTripToAssign}
            setAssignOpen={setAssignOpen}
          />
        </TabsContent>
      </Tabs>
      
      <TripDetailActions 
        viewTrip={viewTrip}
        setEditTrip={setEditTrip}
        setTripToDelete={setTripToDelete}
        setDeleteDialogOpen={setDeleteDialogOpen}
      />
    </div>
  );
}
