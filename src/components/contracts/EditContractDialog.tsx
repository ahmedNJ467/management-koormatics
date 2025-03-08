
import React from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Contract } from "@/pages/Contracts";
import { AlertTriangle, FileText, Download } from "lucide-react";

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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Edit Contract</DialogTitle>
          <DialogDescription>
            Update contract details and upload new document if needed.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                Contract Name
              </Label>
              <Input
                id="edit-name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-client_name" className="text-right">
                Client
              </Label>
              <Input
                id="edit-client_name"
                name="client_name"
                value={formData.client_name}
                onChange={handleInputChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-status" className="text-right">
                Status
              </Label>
              <select
                id="edit-status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              >
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="expired">Expired</option>
              </select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-start_date" className="text-right">
                Start Date
              </Label>
              <Input
                id="edit-start_date"
                name="start_date"
                type="date"
                value={formData.start_date}
                onChange={handleInputChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-end_date" className="text-right">
                End Date
              </Label>
              <Input
                id="edit-end_date"
                name="end_date"
                type="date"
                value={formData.end_date}
                onChange={handleInputChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-contract_file" className="text-right">
                Upload New File
              </Label>
              <div className="col-span-3">
                {isStorageAvailable ? (
                  <Input
                    id="edit-contract_file"
                    name="contract_file"
                    type="file"
                    onChange={handleFileChange}
                    className="w-full"
                    accept=".pdf,.doc,.docx"
                  />
                ) : (
                  <div className="flex items-center text-amber-500 text-sm">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    File upload is currently unavailable
                  </div>
                )}
              </div>
            </div>
            {selectedContract?.contract_file && (
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="text-right">Current File</div>
                <div className="col-span-3 flex items-center text-sm">
                  <FileText className="h-4 w-4 mr-2 text-blue-500" />
                  <span className="text-muted-foreground mr-2">
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
                      className="ml-2"
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
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Updating..." : "Update Contract"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditContractDialog;
