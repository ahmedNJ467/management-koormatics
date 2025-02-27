
import React from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Client } from "@/lib/types";

interface ClientSelectionProps {
  clients: Client[];
  defaultValue?: string;
}

export function ClientSelection({ clients, defaultValue }: ClientSelectionProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="client_id">Client</Label>
      <Select name="client_id" defaultValue={defaultValue}>
        <SelectTrigger>
          <SelectValue placeholder="Select client" />
        </SelectTrigger>
        <SelectContent>
          {clients.map((client) => (
            <SelectItem key={client.id} value={client.id}>
              {client.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
