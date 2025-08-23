
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Save, Filter } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface FilterPreset {
  id: string;
  name: string;
  filters: Record<string, any>;
}

interface FilterPresetsProps {
  currentFilters: Record<string, any>;
  onApplyPreset: (filters: Record<string, any>) => void;
  onFiltersChange: (filters: Record<string, any>) => void;
}

export function FilterPresets({ currentFilters, onApplyPreset, onFiltersChange }: FilterPresetsProps) {
  const [presets, setPresets] = useState<FilterPreset[]>([]);
  const [presetName, setPresetName] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Load presets from localStorage
    const savedPresets = localStorage.getItem('filter-presets');
    if (savedPresets) {
      setPresets(JSON.parse(savedPresets));
    }
  }, []);

  const savePreset = () => {
    if (!presetName.trim()) return;

    const newPreset: FilterPreset = {
      id: Date.now().toString(),
      name: presetName,
      filters: { ...currentFilters }
    };

    const updatedPresets = [...presets, newPreset];
    setPresets(updatedPresets);
    localStorage.setItem('filter-presets', JSON.stringify(updatedPresets));
    setPresetName("");
  };

  const deletePreset = (id: string) => {
    const updatedPresets = presets.filter(p => p.id !== id);
    setPresets(updatedPresets);
    localStorage.setItem('filter-presets', JSON.stringify(updatedPresets));
  };

  const hasActiveFilters = Object.values(currentFilters).some(value => 
    value !== "" && value !== "all" && value !== null && value !== undefined
  );

  const clearAllFilters = () => {
    const clearedFilters = Object.keys(currentFilters).reduce((acc, key) => {
      acc[key] = "";
      return acc;
    }, {} as Record<string, any>);
    onFiltersChange(clearedFilters);
  };

  return (
    <div className="flex items-center gap-2">
      {hasActiveFilters && (
        <Button
          variant="outline"
          size="sm"
          onClick={clearAllFilters}
          className="h-8"
        >
          <X className="h-3 w-3 mr-1" />
          Clear
        </Button>
      )}
      
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-8">
            <Filter className="h-3 w-3 mr-1" />
            Presets
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <Card className="border-0 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Filter Presets</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {hasActiveFilters && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Preset name..."
                      value={presetName}
                      onChange={(e) => setPresetName(e.target.value)}
                      className="h-8"
                    />
                    <Button
                      size="sm"
                      onClick={savePreset}
                      disabled={!presetName.trim()}
                      className="h-8"
                    >
                      <Save className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
              
              {presets.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">Saved Presets</div>
                  {presets.map((preset) => (
                    <div
                      key={preset.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted"
                    >
                      <div
                        className="flex-1 cursor-pointer"
                        onClick={() => {
                          onApplyPreset(preset.filters);
                          setIsOpen(false);
                        }}
                      >
                        <div className="font-medium text-sm">{preset.name}</div>
                        <div className="flex gap-1 mt-1">
                          {Object.entries(preset.filters).map(([key, value]) => {
                            if (!value || value === "all" || value === "") return null;
                            return (
                              <Badge key={key} variant="secondary" className="text-xs">
                                {key}: {value}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deletePreset(preset.id)}
                        className="h-6 w-6 p-0 ml-2"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              
              {presets.length === 0 && !hasActiveFilters && (
                <div className="text-center text-sm text-muted-foreground py-4">
                  Apply filters first, then save them as presets
                </div>
              )}
            </CardContent>
          </Card>
        </PopoverContent>
      </Popover>
    </div>
  );
}
