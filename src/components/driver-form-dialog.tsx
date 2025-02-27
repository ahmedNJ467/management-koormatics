
import { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Driver } from "@/lib/types";
import { AvatarUploadField } from "./driver-form/avatar-upload-field";
import { DocumentUploadField } from "./driver-form/document-upload-field";
import { DriverFields } from "./driver-form/driver-fields";
import { useDriverForm } from "./driver-form/use-driver-form";
import { uploadDriverFile } from "./driver-form/use-driver-uploads";
import type { DriverFormValues } from "./driver-form/types";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";
import { useState } from "react";

interface DriverFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  driver?: Driver;
}

export function DriverFormDialog({ open, onOpenChange, driver }: DriverFormDialogProps) {
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const {
    form,
    isSubmitting,
    setIsSubmitting,
    avatarFile,
    documentFile,
    avatarPreview,
    setAvatarPreview,
    documentName,
    setDocumentName,
    handleAvatarChange,
    handleDocumentChange,
    clearDocument,
  } = useDriverForm(driver);

  useEffect(() => {
    if (driver?.avatar_url) {
      setAvatarPreview(driver.avatar_url);
    }
    if (driver?.document_url) {
      const fileName = driver.document_url.split('/').pop() || 'Document';
      setDocumentName(fileName);
    } else {
      setDocumentName(null);
    }
  }, [driver, setAvatarPreview, setDocumentName]);

  const handleDeleteDriver = async () => {
    if (!driver) return;

    try {
      const { error } = await supabase
        .from("drivers")
        .delete()
        .eq("id", driver.id);

      if (error) throw error;

      toast({
        title: "Driver deleted",
        description: `${driver.name} has been removed from the system.`,
      });
      setShowDeleteDialog(false);
      onOpenChange(false);
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Failed to delete driver",
        description: error instanceof Error ? error.message : "Failed to delete driver",
        variant: "destructive",
      });
    }
  };

  async function onSubmit(values: DriverFormValues) {
    setIsSubmitting(true);
    try {
      let avatarUrl = driver?.avatar_url || null;
      let documentUrl = driver?.document_url || null;
      
      const driverData = {
        name: values.name,
        license_number: values.license_number,
        contact: values.contact,
        license_type: values.license_type,
        license_expiry: values.license_expiry,
        status: values.status,
      };

      if (driver) {
        if (avatarFile) {
          avatarUrl = await uploadDriverFile(avatarFile, 'driver-avatars', driver.id, 'avatar');
        }
        if (documentFile) {
          documentUrl = await uploadDriverFile(documentFile, 'driver-documents', driver.id, 'document');
        }

        const { error } = await supabase
          .from("drivers")
          .update({
            ...driverData,
            ...(avatarUrl && { avatar_url: avatarUrl }),
            ...(documentUrl && { document_url: documentUrl }),
          })
          .eq("id", driver.id);

        if (error) throw error;
      } else {
        const { data: newDriver, error: insertError } = await supabase
          .from("drivers")
          .insert(driverData)
          .select()
          .single();

        if (insertError) throw insertError;

        if (newDriver) {
          if (avatarFile) {
            avatarUrl = await uploadDriverFile(avatarFile, 'driver-avatars', newDriver.id, 'avatar');
          }

          if (documentFile) {
            documentUrl = await uploadDriverFile(documentFile, 'driver-documents', newDriver.id, 'document');
          }

          if (avatarUrl || documentUrl) {
            const { error: updateError } = await supabase
              .from("drivers")
              .update({
                ...(avatarUrl && { avatar_url: avatarUrl }),
                ...(documentUrl && { document_url: documentUrl }),
              })
              .eq("id", newDriver.id);

            if (updateError) throw updateError;
          }
        }
      }

      toast({
        title: `Driver ${driver ? "updated" : "created"} successfully`,
        description: `${values.name} has been ${driver ? "updated" : "added"} to the system.`,
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: `Failed to ${driver ? "update" : "create"} driver`,
        description: error instanceof Error ? error.message : "Failed to save driver",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>{driver ? "Edit Driver" : "Add New Driver"}</DialogTitle>
              {driver && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <AvatarUploadField
                avatarPreview={avatarPreview}
                onAvatarChange={handleAvatarChange}
              />

              <DocumentUploadField
                documentName={documentName}
                onDocumentChange={handleDocumentChange}
                onDocumentClear={clearDocument}
              />

              <DriverFields form={form} />

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : driver ? "Update Driver" : "Add Driver"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {driver?.name}'s record. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteDriver} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
