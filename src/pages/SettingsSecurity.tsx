import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useUsers } from "@/hooks/use-users";
import { Plus } from "lucide-react";
import AddUserDialog from "@/components/users/AddUserDialog";
import { useRole } from "@/hooks/useRole";
import { Navigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MANAGER_ROLE_OPTIONS } from "@/constants/roles";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function SettingsSecurity() {
  const { roles, hasRole } = useRole();
  if (!hasRole("super_admin")) return <Navigate to="/403" />;

  const { data: users = [], isLoading } = useUsers();
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const ROLE_OPTIONS = MANAGER_ROLE_OPTIONS;

  const saveRole = async (userId: string, roleSlug: string | null) => {
    try {
      // Replace all roles with the new single role; super_admin is maintained manually
      // 1) delete existing non-super roles
      const { error: delErr } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .neq("role_slug", "super_admin");
      if (delErr) throw delErr;

      if (roleSlug) {
        const { error: insErr } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role_slug: roleSlug });
        if (insErr) throw insErr;
      }

      toast({ title: "Roles updated" });
    } catch (e) {
      toast({
        title: "Failed to update roles",
        description: (e as Error).message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-semibold tracking-tight">
          User Management
        </h2>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Add User
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Users</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Loading…</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  {/* Removed Name column */}
                  <TableHead>Assigned role</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => {
                  const nonSuper =
                    u.roles.find((r) => r !== "super_admin") || null;
                  const isSuperOnly =
                    u.roles.includes("super_admin") && !nonSuper;
                  const current = isSuperOnly ? "super_admin" : nonSuper;
                  const currentLabel =
                    current === "super_admin"
                      ? "Super admin"
                      : current
                      ? ROLE_OPTIONS.find((r) => r.value === current)?.label ||
                        current
                      : "No role";
                  return (
                    <TableRow key={u.user_id}>
                      <TableCell>{u.email}</TableCell>
                      {/* Removed Name cell */}
                      <TableCell>
                        <div className="max-w-[220px] text-sm text-foreground/90">
                          {currentLabel}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(u.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AddUserDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
