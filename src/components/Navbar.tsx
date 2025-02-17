
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavbarProps {
  onMenuClick: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  return (
    <header className="border-b h-16 px-6 flex items-center justify-between bg-white">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onMenuClick}>
          <Menu className="h-6 w-6" />
        </Button>
        <h1 className="text-xl font-semibold">Peace Business Group</h1>
      </div>
    </header>
  );
}
