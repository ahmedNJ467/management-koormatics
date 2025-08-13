import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Driver } from "@/lib/types";
import { useDriverForm } from "./driver-form/use-driver-form";
import { uploadDriverFile } from "./driver-form/use-driver-uploads";
import type { DriverFormValues } from "./driver-form/types";
import { DeleteDriverDialog } from "./driver-form/delete-driver-dialog";
import { DriverFormContent } from "./driver-form/driver-form-content";

interface DriverFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  driver?: Driver;
  onDriverDeleted?: () => void;
}

export function DriverFormDialog({
  open,
  onOpenChange,
  driver,
  onDriverDeleted,
}: DriverFormDialogProps) {
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const {
    form,
    isSubmitting,
    setIsSubmitting,
    avatarFile,
    documentFile,
    airportIdFile,
    avatarPreview,
    setAvatarPreview,
    documentName,
    setDocumentName,
    airportIdName,
    setAirportIdName,
    handleAvatarChange,
    handleDocumentChange,
    clearDocument,
    handleAirportIdChange,
    clearAirportId,
  } = useDriverForm(driver);

  useEffect(() => {
    if (driver) {
      form.reset({
        name: driver.name,
        contact: driver.contact,
        license_number: driver.license_number,
        license_type: driver.license_type,
        license_expiry: driver.license_expiry,
        status: driver.status,
        is_vip: driver.is_vip || false,
      });
      setAvatarPreview(driver.avatar_url);
      setDocumentName(
        driver.document_url ? driver.document_url.split("/").pop() : null
      );
      setAirportIdName(
        driver.airport_id_url ? driver.airport_id_url.split("/").pop() : null
      );
    } else {
      form.reset({
        name: "",
        contact: "",
        license_number: "",
        license_type: "",
        license_expiry: "",
        status: "active",
        is_vip: false,
      });
      setAvatarPreview(null);
      setDocumentName(null);
      setAirportIdName(null);
    }
      }, [driver, form, setAvatarPreview, setDocumentName, setAirportIdName]);

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
        is_vip: values.is_vip,
      };

      let driverId: string;

      if (driver) {
        const { error: updateError } = await supabase
          .from("drivers")
          .update(driverData)
          .eq("id", driver.id);

        if (updateError) throw updateError;
        driverId = driver.id;
      } else {
        const { data: newDriver, error: insertError } = await supabase
          .from("drivers")
          .insert(driverData)
          .select()
          .single();

        if (insertError) throw insertError;
        if (!newDriver) throw new Error("Failed to create driver");
        driverId = newDriver.id;
      }

      try {
        if (avatarFile) {
          avatarUrl = await uploadDriverFile(
            avatarFile,
            "driver-avatars",
            driverId,
            "avatar"
          );
        }
        if (documentFile) {
          documentUrl = await uploadDriverFile(
            documentFile,
            "driver-documents",
            driverId,
            "document"
          );
        }
        if (airportIdFile) {
          const airportIdUrl = await uploadDriverFile(
            airportIdFile,
            "driver-airport-ids",
            driverId,
            "airport-id"
          );
          // Update the driver with airport ID URL
          await supabase
            .from("drivers")
            .update({ airport_id_url: airportIdUrl })
            .eq("id", driverId);
        }

        if (avatarUrl || documentUrl) {
          const { error: fileUpdateError } = await supabase
            .from("drivers")
            .update({
              ...(avatarUrl && { avatar_url: avatarUrl }),
              ...(documentUrl && { document_url: documentUrl }),
            })
            .eq("id", driverId);

          if (fileUpdateError) throw fileUpdateError;
        }
      } catch (fileError) {
        console.error("File upload error:", fileError);
        toast({
          title: "File upload failed",
          description:
            "Driver was saved but there was an error uploading files.",
          variant: "destructive",
        });
      }

      toast({
        title: `Driver ${driver ? "updated" : "created"} successfully`,
        description: `${values.name} has been ${
          driver ? "updated" : "added"
        } to the system.`,
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: `Failed to ${driver ? "update" : "create"} driver`,
        description:
          error instanceof Error ? error.message : "Failed to save driver",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {driver ? "Edit Driver" : "Add New Driver"}
            </DialogTitle>
            <DialogDescription>
              Enter the driver's information below. Required fields are marked
              with an asterisk.
            </DialogDescription>
          </DialogHeader>
          <DriverFormContent
            form={form}
            driver={driver}
            isSubmitting={isSubmitting}
            avatarPreview={avatarPreview}
            documentName={documentName}
            airportIdName={airportIdName}
            onAvatarChange={handleAvatarChange}
            onDocumentChange={handleDocumentChange}
            onDocumentClear={clearDocument}
            onAirportIdChange={handleAirportIdChange}
            onAirportIdClear={clearAirportId}
            onCancel={() => onOpenChange(false)}
            onDelete={() => setShowDeleteDialog(true)}
            onSubmit={onSubmit}
          />
        </DialogContent>
      </Dialog>

      <DeleteDriverDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        driver={driver}
        onDelete={() => {
          setShowDeleteDialog(false);
          onOpenChange(false);
          onDriverDeleted?.();
        }}
      />
    </>
  );
}
