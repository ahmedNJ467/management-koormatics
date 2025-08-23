
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface FormHeaderProps {
  isEditing: boolean;
  onCancel: () => void;
}

export function FormHeader({ isEditing, onCancel }: FormHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-medium">
        {isEditing ? "Edit Member" : "Add New Member"}
      </h3>
      <Button type="button" variant="ghost" size="icon" onClick={onCancel}>
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
