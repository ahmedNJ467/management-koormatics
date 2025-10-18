
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DisplayTrip } from "@/lib/types/trip";

interface TripMessageDialogProps {
  open: boolean;
  tripToMessage: DisplayTrip | null;
  newMessage: string;
  onMessageChange: (message: string) => void;
  onSendMessage: () => Promise<void>;
  onClose: () => void;
}

export function TripMessageDialog({
  open,
  tripToMessage,
  newMessage,
  onMessageChange,
  onSendMessage,
  onClose
}: TripMessageDialogProps) {
  const formatTripId = (id: string): string => {
    return id.substring(0, 8).toUpperCase();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send Message</DialogTitle>
          <DialogDescription>
            Send a message regarding trip {tripToMessage ? formatTripId(tripToMessage.id) : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea 
              id="message" 
              placeholder="Type your message here..."
              value={newMessage}
              onChange={(e) => onMessageChange(e.target.value)}
              className="min-h-[120px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={() => {
              onSendMessage();
              onClose();
            }}
            disabled={!newMessage.trim()}
          >
            Send Message
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
