import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useRole } from "@/hooks/useRole";
import { Shield, Eye, EyeOff } from "lucide-react";
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
import { MANAGER_ROLE_OPTIONS } from "@/constants/roles";

export default function SettingsSecurity() {
  // Call all hooks unconditionally at the top to keep hook order stable
  const { data: users = [], isLoading } = useUsers();
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();
  const { roles, hasRole, loading } = useRole();
  const router = useRouter();

  // Check if user has super admin role - must be done before any early returns
  useEffect(() => {
    if (!loading && !hasRole("super_admin")) {
      router.push("/403");
    }
  }, [loading, hasRole, router]);

  // Gate rendering after hooks have been called
  if (loading) return null;

  // Check if user has super admin role
  if (!hasRole("super_admin")) {
    return null;
  }

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
    <div className="space-y-8">
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
