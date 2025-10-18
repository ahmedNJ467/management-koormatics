
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SearchBarProps {
  searchQuery: string;
  onChange: (query: string) => void;
}

export const SearchBar = ({ searchQuery, onChange }: SearchBarProps) => {
  return (
    <div className="flex items-center space-x-4 mb-4">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search parts by name, number, category..."
          value={searchQuery}
          onChange={(e) => onChange(e.target.value)}
          className="pl-8 bg-background"
        />
      </div>
    </div>
  );
};
