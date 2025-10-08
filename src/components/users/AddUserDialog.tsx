import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MANAGER_ROLE_OPTIONS } from "@/constants/roles";
import type { ManagerRoleSlug } from "@/constants/roles";

interface AddUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AddUserDialog: React.FC<AddUserDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role_slug: (MANAGER_ROLE_OPTIONS[0]?.value ||
      "fleet_manager") as ManagerRoleSlug,
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const queryClient = useQueryClient();

  const generatePassword = () => {
    setIsGenerating(true);
    const chars =
      "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*";
    let pwd = "";
    for (let i = 0; i < 12; i++) {
      pwd += chars[Math.floor(Math.random() * chars.length)];
    }
    setFormData((p) => ({ ...p, password: pwd }));
    setIsGenerating(false);
  };

  const addUserMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("create-user", {
        body: formData,
      });
      if (error) {
        const details = (error as any)?.context
          ? ` — ${JSON.stringify((error as any).context)}`
          : "";
        throw new Error(`${error.message}${details}`);
      }
      return data;
    },
    onSuccess: () => {
      toast({ title: "User created successfully" });
      queryClient.invalidateQueries({ queryKey: ["system_users"] });
      onOpenChange(false);
      setFormData({
        email: "",
        password: "",
        role_slug: MANAGER_ROLE_OPTIONS[0]?.value || "fleet_manager",
      });
    },
    onError: (err: any) =>
      toast({
        title: "Error creating user",
        description: err.message,
        variant: "destructive",
      }),
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
          <DialogDescription>
            Create a new user account with appropriate role permissions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Email Address</label>
            <Input
              name="email"
              placeholder="user@example.com"
              value={formData.email}
              onChange={handleChange}
              type="email"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Temporary Password</label>
            <div className="flex gap-2">
              <Input
                name="password"
                placeholder="Enter temporary password"
                value={formData.password}
                onChange={handleChange}
                type="password"
                required
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={generatePassword}
                disabled={isGenerating}
              >
                {isGenerating ? "..." : "Generate"}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Role</label>
            <Select
              value={formData.role_slug}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  role_slug: value as ManagerRoleSlug,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {MANAGER_ROLE_OPTIONS.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={addUserMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={() => addUserMutation.mutate()}
            disabled={
              addUserMutation.isPending ||
              !formData.email.trim() ||
              formData.password.length < 8
            }
          >
            {addUserMutation.isPending ? "Creating..." : "Create User"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddUserDialog;
