
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Download, Edit } from "lucide-react";

interface MemberDetailProps {
  member: {
    id?: string;
    name: string;
    role?: string;
    email?: string;
    phone?: string;
    notes?: string;
    document_url?: string;
    document_name?: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
}

export function MemberDetail({ member, isOpen, onClose, onEdit }: MemberDetailProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{member.name}</DialogTitle>
          <DialogDescription>
            {member.role ? `${member.role}` : "Organization Member"}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {member.email && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Email</Label>
              <div className="col-span-3">
                <a href={`mailto:${member.email}`} className="text-blue-600 hover:underline">
                  {member.email}
                </a>
              </div>
            </div>
          )}
          
          {member.phone && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Phone</Label>
              <div className="col-span-3">
                <a href={`tel:${member.phone}`} className="text-blue-600 hover:underline">
                  {member.phone}
                </a>
              </div>
            </div>
          )}
          
          {member.document_url && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Passport/ID</Label>
              <div className="col-span-3">
                <a 
                  href={member.document_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center text-blue-600 hover:underline"
                >
                  <Download className="h-4 w-4 mr-1" />
                  {member.document_name || "View Document"}
                </a>
              </div>
            </div>
          )}
          
          {member.notes && (
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right">Notes</Label>
              <div className="col-span-3 text-sm">
                {member.notes}
              </div>
            </div>
          )}
        </div>
        
        <div className="flex justify-end">
          <Button onClick={onEdit} type="button" className="flex items-center">
            <Edit className="h-4 w-4 mr-2" />
            Edit Member
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
