import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

interface SecurityEscortToggleProps {
  hasSecurityEscort: boolean;
  setHasSecurityEscort: (value: boolean) => void;
  escortCount: number;
  setEscortCount: (count: number) => void;
}

export function SecurityEscortToggle({
  hasSecurityEscort,
  setHasSecurityEscort,
  escortCount,
  setEscortCount,
}: SecurityEscortToggleProps) {
  const handleToggleChange = (checked: boolean) => {
    setHasSecurityEscort(checked);
    if (!checked) {
      setEscortCount(0);
    } else if (escortCount === 0) {
      setEscortCount(1);
    }
  };

  const handleCountChange = (value: string) => {
    const count = parseInt(value);
    setEscortCount(count);
  };

  return (
    <Card className="border-dashed">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Label htmlFor="security_escort" className="text-sm font-medium">
                Security Escort
              </Label>
            </div>
            <Switch
              id="security_escort"
              checked={hasSecurityEscort}
              onCheckedChange={handleToggleChange}
            />
          </div>

          {hasSecurityEscort && (
            <div className="space-y-2 pl-6">
              <Label
                htmlFor="escort_count"
                className="text-sm text-muted-foreground"
              >
                Number of Escort Vehicles
              </Label>
              <Select
                name="escort_count"
                value={escortCount.toString()}
                onValueChange={handleCountChange}
              >
                <SelectTrigger id="escort_count" className="w-full">
                  <SelectValue placeholder="Select escort count" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Escort Vehicle</SelectItem>
                  <SelectItem value="2">2 Escort Vehicles</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Hidden inputs for form submission */}
        <input
          type="hidden"
          name="has_security_escort"
          value={hasSecurityEscort ? "true" : "false"}
        />
        <input
          type="hidden"
          name="escort_count"
          value={hasSecurityEscort ? escortCount.toString() : "0"}
        />
      </CardContent>
    </Card>
  );
}
