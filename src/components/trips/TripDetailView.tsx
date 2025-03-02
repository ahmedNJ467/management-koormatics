
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, MessageCircle, User } from "lucide-react";
import { DisplayTrip } from "@/lib/types/trip";
import { TripMessage } from "@/lib/types/trip/communication";
import { TripAssignment } from "@/lib/types/trip/communication";
import { MessagesTab } from "@/components/trips/tabs/MessagesTab";
import { AssignmentsTab } from "@/components/trips/tabs/AssignmentsTab";
import { DetailsTab } from "@/components/trips/tabs/DetailsTab";
import { TripDetailHeader } from "@/components/trips/TripDetailHeader";
import { TripDetailActions } from "@/components/trips/TripDetailActions";

interface TripDetailViewProps {
  viewTrip: DisplayTrip;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  messages: TripMessage[];
  assignments: TripAssignment[];
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
}

export function TripDetailView({ 
  viewTrip,
  activeTab,
  setActiveTab,
  messages,
  assignments,
  newMessage,
  setNewMessage,
  handleSendMessage,
  setTripToAssign,
  setAssignOpen,
  setTripToMessage,
  setMessageOpen,
  setEditTrip,
  setTripToDelete,
  setDeleteDialogOpen
}: TripDetailViewProps) {
  return (
    <div className="w-full">
      <TripDetailHeader viewTrip={viewTrip} />
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">
        <TabsList>
          <TabsTrigger value="details">
            <FileText className="h-4 w-4 mr-2" />
            Details
          </TabsTrigger>
          <TabsTrigger value="messages">
            <MessageCircle className="h-4 w-4 mr-2" />
            Messages
          </TabsTrigger>
          <TabsTrigger value="assignments">
            <User className="h-4 w-4 mr-2" />
            Assignments
          </TabsTrigger>
        </TabsList>
        <TabsContent value="details" className="space-y-4">
          <DetailsTab viewTrip={viewTrip} />
        </TabsContent>
        <TabsContent value="messages" className="space-y-4">
          <MessagesTab 
            messages={messages}
            newMessage={newMessage}
            setNewMessage={setNewMessage}
            handleSendMessage={handleSendMessage}
          />
        </TabsContent>
        <TabsContent value="assignments" className="space-y-4">
          <AssignmentsTab 
            assignments={assignments}
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
