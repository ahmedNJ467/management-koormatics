
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Building2, User } from "lucide-react";

const clients = [
  {
    id: "C001",
    name: "Acme Corporation",
    type: "Organization",
    contact: "John Manager",
    email: "john@acme.com",
    phone: "+254 712 345 678",
  },
  {
    id: "C002",
    name: "Sarah Johnson",
    type: "Individual",
    email: "sarah.j@email.com",
    phone: "+254 723 456 789",
  },
];

export default function Clients() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">Clients</h2>
          <p className="text-muted-foreground">Manage your client relationships</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add Client
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {clients.map((client) => (
          <Card key={client.id} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-secondary/10 flex items-center justify-center">
                  {client.type === "Organization" ? (
                    <Building2 className="h-6 w-6 text-secondary" />
                  ) : (
                    <User className="h-6 w-6 text-secondary" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold">{client.name}</h3>
                  <p className="text-sm text-muted-foreground">{client.type}</p>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                {client.contact && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Contact:</span>
                    <span>{client.contact}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Email:</span>
                  <span>{client.email}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Phone:</span>
                  <span>{client.phone}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
