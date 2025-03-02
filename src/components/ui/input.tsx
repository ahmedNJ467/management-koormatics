
import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  onAddItem?: () => void;  // For adding new items in list inputs
  onRemoveItem?: () => void;  // For removing items in list inputs
  showAddButton?: boolean;  // To display add button for list inputs
  showRemoveButton?: boolean;  // To display remove button for list inputs
  addButtonLabel?: string;  // Custom label for add button 
  removeButtonLabel?: string;  // Custom label for remove button
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, onAddItem, onRemoveItem, showAddButton, showRemoveButton, addButtonLabel, removeButtonLabel, ...props }, ref) => {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // If Enter is pressed and onAddItem is provided, trigger the add action
      if (e.key === 'Enter' && onAddItem) {
        e.preventDefault();  // Prevent form submission
        onAddItem();
      }
    };

    return (
      <div className={showAddButton || showRemoveButton ? "flex items-center gap-2" : ""}>
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          ref={ref}
          onKeyDown={onAddItem ? handleKeyDown : undefined}
          {...props}
        />

        {showAddButton && onAddItem && (
          <button
            type="button"
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            onClick={onAddItem}
          >
            {addButtonLabel || "Add"}
          </button>
        )}

        {showRemoveButton && onRemoveItem && (
          <button
            type="button"
            className="inline-flex h-10 items-center justify-center rounded-md bg-destructive px-3 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90"
            onClick={onRemoveItem}
          >
            {removeButtonLabel || "Remove"}
          </button>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
