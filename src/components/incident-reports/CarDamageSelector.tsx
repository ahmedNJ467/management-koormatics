import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Car, RotateCcw, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DamagedPart {
  id: string;
  name: string;
  severity: "minor" | "moderate" | "severe";
}

interface CarDamageSelectorProps {
  value: DamagedPart[];
  onChange: (damagedParts: DamagedPart[]) => void;
  className?: string;
}

const carParts = [
  {
    id: "front-bumper",
    name: "Front Bumper",
    x: 200,
    y: 80,
    width: 120,
    height: 25,
  },
  { id: "hood", name: "Hood", x: 180, y: 105, width: 160, height: 80 },
  {
    id: "windshield",
    name: "Windshield",
    x: 190,
    y: 185,
    width: 140,
    height: 60,
  },
  { id: "roof", name: "Roof", x: 180, y: 245, width: 160, height: 120 },
  {
    id: "rear-windshield",
    name: "Rear Windshield",
    x: 190,
    y: 365,
    width: 140,
    height: 50,
  },
  { id: "trunk", name: "Trunk", x: 180, y: 415, width: 160, height: 70 },
  {
    id: "rear-bumper",
    name: "Rear Bumper",
    x: 200,
    y: 485,
    width: 120,
    height: 25,
  },

  // Left side
  {
    id: "left-headlight",
    name: "Left Headlight",
    x: 150,
    y: 90,
    width: 30,
    height: 20,
  },
  {
    id: "left-front-door",
    name: "Left Front Door",
    x: 120,
    y: 185,
    width: 70,
    height: 80,
  },
  {
    id: "left-rear-door",
    name: "Left Rear Door",
    x: 120,
    y: 265,
    width: 70,
    height: 80,
  },
  {
    id: "left-front-wheel",
    name: "Left Front Wheel",
    x: 80,
    y: 150,
    width: 40,
    height: 40,
  },
  {
    id: "left-rear-wheel",
    name: "Left Rear Wheel",
    x: 80,
    y: 330,
    width: 40,
    height: 40,
  },
  {
    id: "left-side-mirror",
    name: "Left Side Mirror",
    x: 100,
    y: 200,
    width: 20,
    height: 15,
  },
  {
    id: "left-taillight",
    name: "Left Taillight",
    x: 150,
    y: 460,
    width: 30,
    height: 20,
  },

  // Right side
  {
    id: "right-headlight",
    name: "Right Headlight",
    x: 340,
    y: 90,
    width: 30,
    height: 20,
  },
  {
    id: "right-front-door",
    name: "Right Front Door",
    x: 330,
    y: 185,
    width: 70,
    height: 80,
  },
  {
    id: "right-rear-door",
    name: "Right Rear Door",
    x: 330,
    y: 265,
    width: 70,
    height: 80,
  },
  {
    id: "right-front-wheel",
    name: "Right Front Wheel",
    x: 400,
    y: 150,
    width: 40,
    height: 40,
  },
  {
    id: "right-rear-wheel",
    name: "Right Rear Wheel",
    x: 400,
    y: 330,
    width: 40,
    height: 40,
  },
  {
    id: "right-side-mirror",
    name: "Right Side Mirror",
    x: 400,
    y: 200,
    width: 20,
    height: 15,
  },
  {
    id: "right-taillight",
    name: "Right Taillight",
    x: 340,
    y: 460,
    width: 30,
    height: 20,
  },
];

const severityColors = {
  minor: "#10b981", // green
  moderate: "#f59e0b", // yellow
  severe: "#ef4444", // red
};

const severityLabels = {
  minor: "Minor",
  moderate: "Moderate",
  severe: "Severe",
};

export function CarDamageSelector({
  value,
  onChange,
  className,
}: CarDamageSelectorProps) {
  const [selectedSeverity, setSelectedSeverity] = useState<
    "minor" | "moderate" | "severe"
  >("minor");

  const handlePartClick = (partId: string, partName: string) => {
    const existingIndex = value.findIndex((part) => part.id === partId);

    if (existingIndex >= 0) {
      // If part already damaged, cycle through severity levels or remove
      const currentSeverity = value[existingIndex].severity;
      let newSeverity: "minor" | "moderate" | "severe" | null = null;

      switch (currentSeverity) {
        case "minor":
          newSeverity = "moderate";
          break;
        case "moderate":
          newSeverity = "severe";
          break;
        case "severe":
          newSeverity = null; // Remove damage
          break;
      }

      if (newSeverity) {
        const newValue = [...value];
        newValue[existingIndex] = {
          id: partId,
          name: partName,
          severity: newSeverity,
        };
        onChange(newValue);
      } else {
        // Remove the damaged part
        onChange(value.filter((part) => part.id !== partId));
      }
    } else {
      // Add new damaged part
      onChange([
        ...value,
        { id: partId, name: partName, severity: selectedSeverity },
      ]);
    }
  };

  const clearAllDamage = () => {
    onChange([]);
  };

  const getDamagedPart = (partId: string) => {
    return value.find((part) => part.id === partId);
  };

  const getPartColor = (partId: string) => {
    const damagedPart = getDamagedPart(partId);
    if (damagedPart) {
      return severityColors[damagedPart.severity];
    }
    return "#e5e7eb"; // default gray
  };

  const getPartOpacity = (partId: string) => {
    const damagedPart = getDamagedPart(partId);
    return damagedPart ? 0.8 : 0.3;
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Vehicle Damage Diagram
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={clearAllDamage}
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Clear All
            </Button>
          </div>
        </div>

        {/* Instructions */}
        <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
          <Info className="h-4 w-4 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">How to use:</p>
            <ul className="text-xs space-y-1">
              <li>• Click on car parts to mark damage</li>
              <li>• Click repeatedly to cycle through severity levels</li>
              <li>• Click a fourth time to remove damage</li>
            </ul>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Severity Selector */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm font-medium">
            Default severity for new damage:
          </span>
          <div className="flex gap-1">
            {(["minor", "moderate", "severe"] as const).map((severity) => (
              <Button
                key={severity}
                type="button"
                variant={selectedSeverity === severity ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedSeverity(severity)}
                className="text-xs"
                style={{
                  backgroundColor:
                    selectedSeverity === severity
                      ? severityColors[severity]
                      : undefined,
                  borderColor: severityColors[severity],
                  color:
                    selectedSeverity === severity
                      ? "white"
                      : severityColors[severity],
                }}
              >
                {severityLabels[severity]}
              </Button>
            ))}
          </div>
        </div>

        {/* Car Diagram */}
        <div className="flex justify-center">
          <TooltipProvider>
            <svg
              width="520"
              height="560"
              viewBox="0 0 520 560"
              className="border rounded-lg bg-gray-50"
            >
              {/* Car outline */}
              <rect
                x="160"
                y="70"
                width="200"
                height="420"
                rx="20"
                ry="20"
                fill="none"
                stroke="#374151"
                strokeWidth="2"
              />

              {/* Car parts */}
              {carParts.map((part) => {
                const damagedPart = getDamagedPart(part.id);
                return (
                  <Tooltip key={part.id}>
                    <TooltipTrigger asChild>
                      <rect
                        x={part.x}
                        y={part.y}
                        width={part.width}
                        height={part.height}
                        rx="4"
                        ry="4"
                        fill={getPartColor(part.id)}
                        opacity={getPartOpacity(part.id)}
                        stroke={
                          damagedPart
                            ? severityColors[damagedPart.severity]
                            : "#9ca3af"
                        }
                        strokeWidth={damagedPart ? "3" : "1"}
                        className="cursor-pointer hover:opacity-100 transition-opacity"
                        onClick={() => handlePartClick(part.id, part.name)}
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-medium">{part.name}</p>
                      {damagedPart && (
                        <p className="text-xs">
                          Current: {severityLabels[damagedPart.severity]} damage
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Click to{" "}
                        {damagedPart ? "change severity" : "mark damage"}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}

              {/* Car labels */}
              <text
                x="260"
                y="50"
                textAnchor="middle"
                className="text-sm font-medium fill-gray-700"
              >
                FRONT
              </text>
              <text
                x="260"
                y="540"
                textAnchor="middle"
                className="text-sm font-medium fill-gray-700"
              >
                REAR
              </text>
              <text
                x="50"
                y="300"
                textAnchor="middle"
                className="text-sm font-medium fill-gray-700"
                transform="rotate(-90 50 300)"
              >
                LEFT
              </text>
              <text
                x="470"
                y="300"
                textAnchor="middle"
                className="text-sm font-medium fill-gray-700"
                transform="rotate(90 470 300)"
              >
                RIGHT
              </text>
            </svg>
          </TooltipProvider>
        </div>

        {/* Damage Summary */}
        {value.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">
              Damaged Parts ({value.length}):
            </h4>
            <div className="flex flex-wrap gap-2">
              {value.map((part) => (
                <Badge
                  key={part.id}
                  variant="outline"
                  className="cursor-pointer hover:bg-gray-100"
                  style={{
                    borderColor: severityColors[part.severity],
                    color: severityColors[part.severity],
                  }}
                  onClick={() => handlePartClick(part.id, part.name)}
                >
                  {part.name} - {severityLabels[part.severity]}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium mb-2">Damage Severity Legend:</h4>
          <div className="flex gap-4 text-xs">
            {(["minor", "moderate", "severe"] as const).map((severity) => (
              <div key={severity} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: severityColors[severity] }}
                />
                <span>{severityLabels[severity]}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
