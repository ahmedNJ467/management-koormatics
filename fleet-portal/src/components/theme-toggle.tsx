import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [isAnimating, setIsAnimating] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleToggle = () => {
    setIsAnimating(true);
    const next = (resolvedTheme === "light" ? "dark" : "light") as
      | "light"
      | "dark";
    setTheme(next);

    // Reset animation state after transition completes
    setTimeout(() => {
      setIsAnimating(false);
    }, 300);
  };

  // Avoid rendering invisible icons before hydration resolves the theme
  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9"
        aria-label="Toggle theme"
      >
        <Sun className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      className="h-9 w-9 hover:bg-muted/50 relative overflow-hidden"
      aria-label="Toggle theme"
    >
      <Sun
        className={`h-4 w-4 transition-all duration-300 ${
          resolvedTheme === "light"
            ? "rotate-0 scale-100 opacity-100"
            : "rotate-180 scale-0 opacity-0"
        }`}
      />
      <Moon
        className={`absolute h-4 w-4 transition-all duration-300 ${
          resolvedTheme === "dark"
            ? "rotate-0 scale-100 opacity-100"
            : "rotate-180 scale-0 opacity-0"
        }`}
      />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
