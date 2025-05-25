
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
      case 'scheduled': return 'bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/20 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/40';
      case 'in_progress': return 'bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/40';
      case 'completed': return 'bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/40';
      case 'cancelled': return 'bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500/20 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/40';
      default: return 'bg-muted text-muted-foreground border-border hover:bg-muted/80';
    }
  };

  const isOrganizationTrip = viewTrip.client_type === "organization";
  const hasPassengers = isOrganizationTrip && Array.isArray(viewTrip.passengers) && viewTrip.passengers.length > 0;

  console.log("Trip in TripDetailView:", viewTrip);
  console.log("Is organization trip:", isOrganizationTrip);
  console.log("Passengers:", viewTrip.passengers);

  return (
    <div className="w-full">
      <div className="bg-gradient-to-r from-muted/50 to-muted/30 dark:from-muted/70 dark:to-muted/50 p-6 rounded-lg mb-6 border border-border">
        <DialogTitle className="text-xl font-semibold mb-3 text-card-foreground flex items-center">
          <Calendar className="h-5 w-5 mr-2 text-primary" />
          {formatDate(viewTrip.date)}
          <span className="mx-2 text-muted-foreground">•</span>
          <MapPin className="h-5 w-5 mr-2 text-primary" />
          {viewTrip.pickup_location.split(',')[0]}
        </DialogTitle>
        
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <Badge variant="outline" className={`font-medium ${getStatusColor(viewTrip.status)}`}>
            {viewTrip.status.replace('_', ' ').toUpperCase()}
          </Badge>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
            {tripTypeDisplayMap[viewTrip.type]}
          </Badge>
          {isOrganizationTrip && (
            <Badge variant="outline" className="bg-secondary/10 text-secondary border-secondary/20 hover:bg-secondary/20">
              Organization
            </Badge>
          )}
          {hasPassengers && (
            <Badge variant="outline" className="bg-accent/10 text-accent-foreground border-accent/20 hover:bg-accent/20">
              {viewTrip.passengers?.length} {viewTrip.passengers?.length === 1 ? 'Passenger' : 'Passengers'}
            </Badge>
          )}
        </div>
        
        <DialogDescription className="text-sm text-muted-foreground mb-2">
          Trip ID: {viewTrip.id.substring(0, 8).toUpperCase()}
        </DialogDescription>
      </div>

      <TripDetailHeader viewTrip={viewTrip} />
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">
        <TabsList className="w-full bg-muted p-1 border border-border rounded-md">
          <TabsTrigger value="details" className="flex-1 text-muted-foreground data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
            <FileText className="h-4 w-4 mr-2" />
            Details
          </TabsTrigger>
          {isOrganizationTrip && (
            <TabsTrigger value="passengers" className="flex-1 text-muted-foreground data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
              <Users className="h-4 w-4 mr-2" />
              Passengers
            </TabsTrigger>
          )}
          <TabsTrigger value="messages" className="flex-1 text-muted-foreground data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
            <MessageCircle className="h-4 w-4 mr-2" />
            Messages
          </TabsTrigger>
          <TabsTrigger value="assignments" className="flex-1 text-muted-foreground data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
            <UserCircle className="h-4 w-4 mr-2" />
            Assignments
          </TabsTrigger>
        </TabsList>
        <TabsContent value="details" className="space-y-4 mt-4">
          <DetailsTab viewTrip={viewTrip} />
        </TabsContent>
        {isOrganizationTrip && (
          <TabsContent value="passengers" className="space-y-4 mt-4">
            <PassengersTab 
              viewTrip={viewTrip} 
              setViewTrip={setViewTrip} 
              queryClient={queryClient} 
            />
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
