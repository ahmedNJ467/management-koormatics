import React from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, FileText } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import { format, parseISO } from "date-fns";

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
          <DialogTitle className="text-xl">Add New Contract</DialogTitle>
          <DialogDescription>
            Enter contract details and upload a document file.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-base font-medium">
                Contract Name
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="h-11"
                required
                placeholder="Enter contract name"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="client_name" className="text-base font-medium">
                Client
              </Label>
              <Input
                id="client_name"
                name="client_name"
                value={formData.client_name}
                onChange={handleInputChange}
                className="h-11"
                required
                placeholder="Enter client name"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="status" className="text-base font-medium">
                Status
              </Label>
              <select
                id="status"
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
              <Label htmlFor="start_date" className="text-base font-medium">
                Start Date
              </Label>
              <DatePicker
                date={formData.start_date ? parseISO(formData.start_date) : undefined}
                onDateChange={handleDateChange('start_date')}
                className="h-11"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="end_date" className="text-base font-medium">
                End Date
              </Label>
              <DatePicker
                date={formData.end_date ? parseISO(formData.end_date) : undefined}
                onDateChange={handleDateChange('end_date')}
                className="h-11"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="contract_file" className="text-base font-medium">
                Upload File
              </Label>
              {isStorageAvailable ? (
                <div className="border border-input rounded-md p-2">
                  <Input
                    id="contract_file"
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
          </div>
          
          <DialogFooter className="pt-2 gap-2">
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
