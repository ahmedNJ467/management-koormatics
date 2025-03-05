
import { Button } from "@/components/ui/button";
import { Plus, ArrowUpDown } from "lucide-react";

interface HeaderActionsProps {
  onAddClick: () => void;
  onExportClick: () => void;
}

export const HeaderActions = ({ onAddClick, onExportClick }: HeaderActionsProps) => {
  return (
    <div className="flex justify-between items-center">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Spare Parts Inventory</h1>
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          onClick={onExportClick}
          className="flex items-center gap-2"
        >
          <ArrowUpDown className="h-4 w-4" />
          Export CSV
        </Button>
        <Button onClick={onAddClick} className="bg-purple-600 hover:bg-purple-700">
          <Plus className="mr-2 h-4 w-4" /> Add Part
        </Button>
      </div>
    </div>
  );
};
