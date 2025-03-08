
import React from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, FileText } from "lucide-react";

interface AddContractDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: {
    name: string;
    client_name: string;
    status: string;
    start_date: string;
    end_date: string;
  };
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent) => void;
  isPending: boolean;
  isStorageAvailable?: boolean;
}

const AddContractDialog = ({
  open,
  onOpenChange,
  formData,
  handleInputChange,
  handleFileChange,
  handleSubmit,
  isPending,
  isStorageAvailable = true,
}: AddContractDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Add New Contract</DialogTitle>
          <DialogDescription>
            Enter contract details and upload a document file.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-5 items-center gap-4">
              <Label htmlFor="name" className="text-right text-base font-medium">
                Contract Name
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="col-span-4 h-11"
                required
                placeholder="Enter contract name"
              />
            </div>
            <div className="grid grid-cols-5 items-center gap-4">
              <Label htmlFor="client_name" className="text-right text-base font-medium">
                Client
              </Label>
              <Input
                id="client_name"
                name="client_name"
                value={formData.client_name}
                onChange={handleInputChange}
                className="col-span-4 h-11"
                required
                placeholder="Enter client name"
              />
            </div>
            <div className="grid grid-cols-5 items-center gap-4">
              <Label htmlFor="status" className="text-right text-base font-medium">
                Status
              </Label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="col-span-4 flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              >
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="expired">Expired</option>
              </select>
            </div>
            <div className="grid grid-cols-5 items-center gap-4">
              <Label htmlFor="start_date" className="text-right text-base font-medium">
                Start Date
              </Label>
              <Input
                id="start_date"
                name="start_date"
                type="date"
                value={formData.start_date}
                onChange={handleInputChange}
                className="col-span-4 h-11"
                required
              />
            </div>
            <div className="grid grid-cols-5 items-center gap-4">
              <Label htmlFor="end_date" className="text-right text-base font-medium">
                End Date
              </Label>
              <Input
                id="end_date"
                name="end_date"
                type="date"
                value={formData.end_date}
                onChange={handleInputChange}
                className="col-span-4 h-11"
                required
              />
            </div>
            <div className="grid grid-cols-5 items-center gap-4">
              <Label htmlFor="contract_file" className="text-right text-base font-medium">
                Upload File
              </Label>
              <div className="col-span-4">
                {isStorageAvailable ? (
                  <Input
                    id="contract_file"
                    name="contract_file"
                    type="file"
                    onChange={handleFileChange}
                    className="w-full h-11"
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
          </div>
          <DialogFooter className="mt-4 gap-2">
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)} className="h-11">
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="h-11">
              {isPending ? "Saving..." : "Save Contract"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddContractDialog;
