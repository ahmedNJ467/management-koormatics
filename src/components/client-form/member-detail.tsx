
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MemberFormValues } from "./types";
import { FileText, Pencil, Trash2 } from "lucide-react";

interface MemberDetailProps {
  member: MemberFormValues;
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function MemberDetail({
  member,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}: MemberDetailProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Member Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <h3 className="font-semibold text-lg">{member.name}</h3>
            {member.role && (
              <p className="text-muted-foreground">{member.role}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            {member.email && (
              <div>
                <p className="font-medium">Email</p>
                <p>{member.email}</p>
              </div>
            )}

            {member.phone && (
              <div>
                <p className="font-medium">Phone</p>
                <p>{member.phone}</p>
              </div>
            )}
          </div>

          {member.document_url && (
            <div className="mt-4">
              <p className="font-medium text-sm">Document</p>
              <div className="flex items-center mt-1">
                <FileText className="h-4 w-4 mr-2 text-blue-500" />
                <a
                  href={member.document_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline text-sm"
                >
                  {member.document_name || "View Document"}
                </a>
              </div>
            </div>
          )}

          {member.notes && (
            <div className="mt-4">
              <p className="font-medium text-sm">Notes</p>
              <p className="text-sm whitespace-pre-wrap">{member.notes}</p>
            </div>
          )}
        </div>
        <DialogFooter className="flex justify-between sm:justify-between">
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onEdit}
              className="flex items-center gap-1"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={onDelete}
              className="flex items-center gap-1"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
