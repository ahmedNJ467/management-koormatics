
import React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Send } from "lucide-react";
import { DisplayTrip } from "@/lib/types/trip";

interface TripMessageDialogProps {
  messageOpen: boolean;
  setMessageOpen: (open: boolean) => void;
  tripToMessage: DisplayTrip | null;
  newMessage: string;
  setNewMessage: (message: string) => void;
  handleSendMessage: () => Promise<void>;
}

const TripMessageDialog: React.FC<TripMessageDialogProps> = ({
  messageOpen,
  setMessageOpen,
  tripToMessage,
  newMessage,
  setNewMessage,
  handleSendMessage,
}) => {
  return (
    <Dialog open={messageOpen} onOpenChange={setMessageOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send Message</DialogTitle>
          <DialogDescription>
            Send a message to the client and driver for this trip.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="trip-message">Message</Label>
            <Textarea 
              id="trip-message"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Enter your message"
              rows={5}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="secondary" onClick={() => setMessageOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSendMessage} 
            disabled={!newMessage.trim()}
          >
            <Send className="h-4 w-4 mr-2" /> Send Message
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TripMessageDialog;
