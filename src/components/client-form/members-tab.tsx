
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import { MembersList } from "./members-list";
import { MemberDetail } from "./member-detail";
import { MemberForm } from "./member-form";
import { MemberFormValues } from "./types";
import { useToast } from "@/hooks/use-toast";

interface MembersTabProps {
  members: MemberFormValues[];
  setMembers: (members: MemberFormValues[]) => void;
  clientId?: string;
}

export function MembersTab({ members, setMembers, clientId }: MembersTabProps) {
  const { toast } = useToast();
  const [editingMemberIndex, setEditingMemberIndex] = useState<number | null>(null);
  const [isViewingMember, setIsViewingMember] = useState<boolean>(false);
  const [viewingMemberIndex, setViewingMemberIndex] = useState<number | null>(null);
  const [isAddingMember, setIsAddingMember] = useState<boolean>(false);
  const [memberFormState, setMemberFormState] = useState<MemberFormValues>({
    name: "",
    role: "",
    email: "",
    phone: "",
    notes: "",
    document_url: "",
    document_name: ""
  });

  const addMember = () => {
    setIsAddingMember(true);
    setMemberFormState({
      id: crypto.randomUUID(), // Generate a temporary ID for new members
      name: "",
      role: "",
      email: "",
      phone: "",
      notes: "",
      document_url: "",
      document_name: ""
    });
  };

  const editMember = (index: number) => {
    setEditingMemberIndex(index);
    setMemberFormState({...members[index]});
    setIsAddingMember(true);
  };

  const viewMember = (index: number) => {
    setViewingMemberIndex(index);
    setIsViewingMember(true);
  };

  const handleCloseViewDialog = () => {
    setIsViewingMember(false);
    // Don't reset the viewingMemberIndex until the dialog is fully closed
    // This prevents the component from trying to access a non-existent member
  };

  const cancelMemberEdit = () => {
    setIsAddingMember(false);
    setEditingMemberIndex(null);
    setMemberFormState({
      name: "",
      role: "",
      email: "",
      phone: "",
      notes: "",
      document_url: "",
      document_name: ""
    });
  };

  const saveMember = () => {
    if (!memberFormState.name || memberFormState.name.trim().length < 2) {
      toast({
        title: "Validation Error",
        description: "Member name must be at least 2 characters long",
        variant: "destructive",
      });
      return;
    }

    if (memberFormState.email && !memberFormState.email.includes('@')) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }
    
    const newMembers = [...members];
    
    if (editingMemberIndex !== null) {
      // Edit existing member
      newMembers[editingMemberIndex] = memberFormState;
    } else {
      // Add new member
      newMembers.push(memberFormState);
    }
    
    setMembers(newMembers);
    setIsAddingMember(false);
    setEditingMemberIndex(null);
    setMemberFormState({
      name: "",
      role: "",
      email: "",
      phone: "",
      notes: "",
      document_url: "",
      document_name: ""
    });

    toast({
      title: editingMemberIndex !== null ? "Member Updated" : "Member Added",
      description: editingMemberIndex !== null 
        ? "The member has been updated successfully."
        : "A new member has been added successfully.",
    });
  };

  const deleteMember = (index: number) => {
    const newMembers = [...members];
    newMembers.splice(index, 1);
    setMembers(newMembers);

    toast({
      title: "Member Removed",
      description: "The member has been removed successfully.",
    });
  };

  const handleMemberDocumentUpload = (url: string, name: string) => {
    setMemberFormState({
      ...memberFormState,
      document_url: url,
      document_name: name
    });
  };

  const clearMemberDocument = () => {
    setMemberFormState({
      ...memberFormState,
      document_url: "",
      document_name: ""
    });
  };

  return (
    <div className="space-y-4 mt-4">
      {!isAddingMember ? (
        <>
          <div className="flex items-center justify-between">
            <Label>Organization Members</Label>
            <Button type="button" variant="outline" onClick={addMember}>
              <UserPlus className="mr-2 h-4 w-4" /> Add Member
            </Button>
          </div>
          
          <MembersList 
            members={members} 
            onEdit={editMember}
            onDelete={deleteMember}
            onView={viewMember}
          />
        </>
      ) : (
        <MemberForm 
          isEditing={editingMemberIndex !== null}
          member={memberFormState}
          clientId={clientId}
          onMemberChange={setMemberFormState}
          onCancel={cancelMemberEdit}
          onSave={saveMember}
          onDocumentUploaded={handleMemberDocumentUpload}
          onDocumentClear={clearMemberDocument}
        />
      )}

      {/* Member Detail View Dialog */}
      {isViewingMember && viewingMemberIndex !== null && members[viewingMemberIndex] && (
        <MemberDetail
          member={members[viewingMemberIndex]}
          isOpen={isViewingMember}
          onClose={handleCloseViewDialog}
          onEdit={() => {
            setIsViewingMember(false);
            editMember(viewingMemberIndex);
          }}
        />
      )}
    </div>
  );
}
