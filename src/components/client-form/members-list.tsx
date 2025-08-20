
import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Download } from "lucide-react";
import { MemberFormValues } from "./types";

interface MembersListProps {
  members: MemberFormValues[];
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
  onView: (index: number) => void;
}

export function MembersList({ members, onEdit, onDelete, onView }: MembersListProps) {
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
  
  const handleDelete = (index: number) => {
    setDeleteIndex(index);
  };

  const confirmDelete = () => {
    if (deleteIndex !== null) {
      onDelete(deleteIndex);
      setDeleteIndex(null);
    }
  };

  const handleRowClick = (index: number) => {
    onView(index);
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Document</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                  No members added yet
                </TableCell>
              </TableRow>
            ) : (
              members.map((member, index) => (
                <TableRow 
                  key={index} 
                  className="cursor-pointer hover:bg-muted/60"
                  onClick={() => handleRowClick(index)}
                >
                  <TableCell>{member.name}</TableCell>
                  <TableCell>{member.role || "-"}</TableCell>
                  <TableCell>{member.email || "-"}</TableCell>
                  <TableCell>{member.phone || "-"}</TableCell>
                  <TableCell>
                    {member.document_url ? (
                      <a
                        href={member.document_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-1 text-blue-600 hover:text-blue-800"
                        onClick={(e) => e.stopPropagation()} // Prevent row click when clicking on document link
                      >
                        <Download className="h-4 w-4" />
                        <span className="text-xs truncate max-w-[100px]">
                          {member.document_name || "View Document"}
                        </span>
                      </a>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteIndex !== null} onOpenChange={(open) => !open && setDeleteIndex(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove this member from the organization. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
