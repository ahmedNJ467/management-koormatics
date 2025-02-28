
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import { MemberFormValues } from "./types";

interface MemberDetailProps {
  member: MemberFormValues;
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
}

export function MemberDetail({ member, isOpen, onClose, onEdit }: MemberDetailProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Member Details</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <div className="text-sm font-medium">Name:</div>
            <div className="col-span-3">{member.name}</div>
          </div>
          
          {member.role && (
            <div className="grid grid-cols-4 items-center gap-4">
              <div className="text-sm font-medium">Role:</div>
              <div className="col-span-3">{member.role}</div>
            </div>
          )}
          
          {member.email && (
            <div className="grid grid-cols-4 items-center gap-4">
              <div className="text-sm font-medium">Email:</div>
              <div className="col-span-3">{member.email}</div>
            </div>
          )}
          
          {member.phone && (
            <div className="grid grid-cols-4 items-center gap-4">
              <div className="text-sm font-medium">Phone:</div>
              <div className="col-span-3">{member.phone}</div>
            </div>
          )}
          
          {member.document_url && (
            <div className="grid grid-cols-4 items-center gap-4">
              <div className="text-sm font-medium">Document:</div>
              <div className="col-span-3">
                <a 
                  href={member.document_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
                >
                  <FileText className="h-4 w-4" />
                  <span>{member.document_name || "View Document"}</span>
                </a>
              </div>
            </div>
          )}
          
          {member.notes && (
            <div className="grid grid-cols-4 items-center gap-4">
              <div className="text-sm font-medium">Notes:</div>
              <div className="col-span-3 whitespace-pre-wrap">{member.notes}</div>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={onEdit}>
            Edit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
