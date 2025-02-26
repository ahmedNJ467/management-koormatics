
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Driver, DriverStatus } from "@/lib/types";
import { FileText, Image, Upload } from "lucide-react";

const driverSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  contact: z.string().min(5, "Contact must be at least 5 characters"),
  license_number: z.string().min(3, "License number is required"),
  license_type: z.string().min(1, "License type is required"),
  license_expiry: z.string().min(1, "License expiry is required"),
  status: z.enum(["active", "inactive", "on_leave"] as const),
});

type DriverFormValues = z.infer<typeof driverSchema>;

interface DriverFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  driver?: Driver;
}

export function DriverFormDialog({ open, onOpenChange, driver }: DriverFormDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [documentName, setDocumentName] = useState<string | null>(null);

  // Initialize avatar preview when driver prop changes
  useEffect(() => {
    if (driver?.avatar_url) {
      setAvatarPreview(driver.avatar_url);
    } else {
      setAvatarPreview(null);
    }
    if (driver?.document_url) {
      const fileName = driver.document_url.split('/').pop() || 'Document';
      setDocumentName(fileName);
    } else {
      setDocumentName(null);
    }
  }, [driver]);

  const form = useForm<DriverFormValues>({
    resolver: zodResolver(driverSchema),
    defaultValues: {
      name: driver?.name ?? "",
      contact: driver?.contact ?? "",
      license_number: driver?.license_number ?? "",
      license_type: driver?.license_type ?? "",
      license_expiry: driver?.license_expiry ?? "",
      status: (driver?.status as DriverStatus) ?? "active",
    },
  });

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const objectUrl = URL.createObjectURL(file);
      setAvatarPreview(objectUrl);
    }
  };

  const handleDocumentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setDocumentFile(file);
      setDocumentName(file.name);
    }
  };

  async function uploadFile(file: File, bucket: string, driverId: string, fileType: string): Promise<string | null> {
    const fileExt = file.name.split('.').pop();
    const filePath = `${driverId}/${fileType}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        upsert: true
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return publicUrl;
  }

  async function onSubmit(data: DriverFormValues) {
    setIsSubmitting(true);
    try {
      let avatarUrl = null;
      let documentUrl = null;
      
      if (driver) {
        // Update existing driver
        if (avatarFile) {
          avatarUrl = await uploadFile(avatarFile, 'driver-avatars', driver.id, 'avatar');
        }
        if (documentFile) {
          documentUrl = await uploadFile(documentFile, 'driver-documents', driver.id, 'document');
        }

        const { error } = await supabase
          .from("drivers")
          .update({
            name: data.name,
            contact: data.contact,
            license_number: data.license_number,
            license_type: data.license_type,
            license_expiry: data.license_expiry,
            status: data.status,
            ...(avatarUrl && { avatar_url: avatarUrl }),
            ...(documentUrl && { document_url: documentUrl }),
          })
          .eq("id", driver.id);

        if (error) throw error;
      } else {
        // Create new driver
        const { data: newDriver, error: insertError } = await supabase
          .from("drivers")
          .insert({
            name: data.name,
            contact: data.contact,
            license_number: data.license_number,
            license_type: data.license_type,
            license_expiry: data.license_expiry,
            status: data.status,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        if (newDriver) {
          const updates: Partial<Driver> = {};

          if (avatarFile) {
            avatarUrl = await uploadFile(avatarFile, 'driver-avatars', newDriver.id, 'avatar');
            updates.avatar_url = avatarUrl;
          }

          if (documentFile) {
            documentUrl = await uploadFile(documentFile, 'driver-documents', newDriver.id, 'document');
            updates.document_url = documentUrl;
          }

          if (Object.keys(updates).length > 0) {
            const { error: updateError } = await supabase
              .from("drivers")
              .update(updates)
              .eq("id", newDriver.id);

            if (updateError) throw updateError;
          }
        }
      }

      toast({
        title: `Driver ${driver ? "updated" : "created"} successfully`,
        description: `${data.name} has been ${driver ? "updated" : "added"} to the system.`,
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: `Failed to ${driver ? "update" : "create"} driver`,
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{driver ? "Edit Driver" : "Add New Driver"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative h-24 w-24 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Image className="h-8 w-8 text-gray-400" />
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                  id="avatar-upload"
                />
                <label
                  htmlFor="avatar-upload"
                  className="flex items-center space-x-2 px-4 py-2 border rounded-md cursor-pointer hover:bg-gray-50"
                >
                  <Upload className="h-4 w-4" />
                  <span>Upload Avatar</span>
                </label>
              </div>
            </div>

            <div className="flex flex-col space-y-2">
              <label className="text-sm font-medium">License Document</label>
              <div className="flex items-center space-x-2">
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleDocumentChange}
                  className="hidden"
                  id="document-upload"
                />
                <label
                  htmlFor="document-upload"
                  className="flex items-center space-x-2 px-4 py-2 border rounded-md cursor-pointer hover:bg-gray-50"
                >
                  <FileText className="h-4 w-4" />
                  <span>{documentName || "Upload Document"}</span>
                </label>
                {documentName && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDocumentFile(null);
                      setDocumentName(null);
                    }}
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact</FormLabel>
                  <FormControl>
                    <Input placeholder="+1234567890" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="license_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>License Number</FormLabel>
                  <FormControl>
                    <Input placeholder="DL12345" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="license_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>License Type</FormLabel>
                  <FormControl>
                    <Input placeholder="Commercial" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="license_expiry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>License Expiry</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <FormControl>
                    <select
                      {...field}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="on_leave">On Leave</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
  );
}
