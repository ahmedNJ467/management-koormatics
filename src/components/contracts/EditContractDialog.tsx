import React from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Contract } from "@/pages/Contracts";
import { AlertTriangle, FileText, Download } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import { format, parseISO } from "date-fns";

interface EditContractDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: Partial<Contract>;
  selectedContract: Contract | null;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent) => void;
  isPending: boolean;
  isStorageAvailable?: boolean;
  onDownload?: (contract: Contract) => void;
}

const EditContractDialog = ({
  open,
  onOpenChange,
  formData,
  selectedContract,
  handleInputChange,
  handleFileChange,
  handleSubmit,
  isPending,
  isStorageAvailable = true,
  onDownload,
}: EditContractDialogProps) => {
  const handleDateChange = (name: 'start_date' | 'end_date') => (date: Date | undefined) => {
    const value = date ? format(date, 'yyyy-MM-dd') : '';
    const event = {
      target: {
        name,
        value,
      },
    } as React.ChangeEvent<HTMLInputElement>;
    handleInputChange(event);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Edit Contract</DialogTitle>
          <DialogDescription>
            Update contract details and upload new document if needed.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name" className="text-base font-medium">
                Contract Name
              </Label>
              <Input
                id="edit-name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="h-11"
                required
                placeholder="Enter contract name"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="edit-client_name" className="text-base font-medium">
                Client
              </Label>
              <Input
                id="edit-client_name"
                name="client_name"
                value={formData.client_name}
                onChange={handleInputChange}
                className="h-11"
                required
                placeholder="Enter client name"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="edit-status" className="text-base font-medium">
                Status
              </Label>
              <select
                id="edit-status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              >
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="expired">Expired</option>
                <option value="terminated">Terminated</option>
              </select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="edit-start_date" className="text-base font-medium">
                Start Date
              </Label>
              <DatePicker
                date={formData.start_date ? parseISO(formData.start_date) : undefined}
                onDateChange={handleDateChange('start_date')}
                className="h-11"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="edit-end_date" className="text-base font-medium">
                End Date
              </Label>
              <DatePicker
                date={formData.end_date ? parseISO(formData.end_date) : undefined}
                onDateChange={handleDateChange('end_date')}
                className="h-11"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="edit-contract_file" className="text-base font-medium">
                Upload New File
              </Label>
              {isStorageAvailable ? (
                <div className="border border-input rounded-md p-2">
                  <Input
                    id="edit-contract_file"
                    name="contract_file"
                    type="file"
                    onChange={handleFileChange}
                    className="w-full h-11 border-0"
                    accept=".pdf,.doc,.docx"
                  />
                  <p className="text-xs text-muted-foreground mt-1 ml-1">
                    <FileText className="inline h-3 w-3 mr-1" />
                    Accepted formats: PDF, DOC, DOCX (Max 10MB)
                  </p>
                </div>
              ) : (
                <div className="flex items-center text-amber-500 text-sm p-3 bg-amber-50 rounded-md">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  File upload is currently unavailable
                </div>
              )}
            </div>
            
            {selectedContract?.contract_file && (
              <div className="grid gap-2">
                <Label className="text-base font-medium">Current File</Label>
                <div className="flex items-center p-3 bg-gray-50 rounded-md">
                  <FileText className="h-5 w-5 mr-2 text-blue-500" />
                  <span className="text-sm text-muted-foreground mr-3">
                    A file is already attached
                  </span>
                  {onDownload && isStorageAvailable && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        if (selectedContract && onDownload) {
                          onDownload(selectedContract);
                        }
                      }}
                      className="ml-auto"
                      title="Download contract file"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter className="pt-2 gap-2">
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)} className="h-11">
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="h-11">
              {isPending ? "Updating..." : "Update Contract"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditContractDialog;
