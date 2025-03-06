
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, FileText, Pencil, Trash } from "lucide-react";
import { MemberFormValues } from "./types";
import { useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface MemberDetailProps {
  member: MemberFormValues;
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function MemberDetail({ member, isOpen, onClose, onEdit, onDelete }: MemberDetailProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  
  // Handler to prevent event propagation and ensure dialog remains open
  const handleDialogChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
    // Don't call onClose when dialog opens, only when it closes
  };

  const handleDeleteClick = () => {
    setConfirmDelete(true);
  };

  const handleConfirmDelete = () => {
    setConfirmDelete(false);
    onDelete();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleDialogChange}>
        <DialogContent className="sm:max-w-[425px]" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Member Details</DialogTitle>
            <DialogDescription>
              Details for {member.name}
            </DialogDescription>
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
                    <span className="ml-2">{member.document_name || "View Document"}</span>
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
          
          <DialogFooter className="flex justify-between space-x-2">
            <div className="flex-grow">
              <Button variant="destructive" onClick={handleDeleteClick} className="w-full">
                <Trash className="h-4 w-4 mr-2" /> Delete
              </Button>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button onClick={onEdit}>
                <Pencil className="h-4 w-4 mr-2" /> Edit
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove this member from the organization. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
