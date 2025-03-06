
import { DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ClientForm } from "./client-form";
import { ClientDocument } from "./types";
import { UseFormReturn } from "react-hook-form";

interface ClientDialogContentProps {
  client: any | null;
  dialogTitle: string;
  form: UseFormReturn<any>;
  isSubmitting: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  contacts: any[];
  setContacts: (contacts: any[]) => void;
  members: any[];
  setMembers: (members: any[]) => void;
  documents: ClientDocument[];
  documentFiles: File[];
  profilePreview: string | null;
  handleProfileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleDocumentUpload: (files: FileList) => void;
  removeDocument: (docId: string) => void;
  onOpenChange: (open: boolean) => void;
  onDelete: () => void;
  onRestore?: () => void;
  onPermanentDelete?: () => void;
  handleFormSubmit: (values: any) => Promise<boolean>;
  isArchived?: boolean;
}
