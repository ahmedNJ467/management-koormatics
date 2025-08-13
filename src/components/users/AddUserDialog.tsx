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
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AddUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

import { MANAGER_ROLE_OPTIONS } from "@/constants/roles";

// Manager roles aligned with domain access
const roles = MANAGER_ROLE_OPTIONS.map((r) => ({
  slug: r.value,
  name: r.label,
}));

const AddUserDialog: React.FC<AddUserDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role_slug: roles[0].slug,
  });

  const [isGenerating, setIsGenerating] = useState(false);

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

  const queryClient = useQueryClient();

  const addUserMutation = useMutation({
    mutationFn: async () => {
      // Call Supabase Edge Function
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
      toast({ title: "User created" });
      queryClient.invalidateQueries({ queryKey: ["system_users"] });
      onOpenChange(false);
      setFormData({
        email: "",
        password: "",
        role_slug: roles[0].slug,
      });
    },
    onError: (err: any) =>
      toast({
        title: "Error",
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
          <DialogTitle>Add user</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          Provide essential details and assign a manager role.
        </DialogDescription>
        <div className="space-y-3">
          <Input
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            type="email"
          />
          <div className="flex gap-2">
            <Input
              name="password"
              placeholder="Temporary password"
              value={formData.password}
              onChange={handleChange}
              type="password"
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={generatePassword}
              disabled={isGenerating}
            >
              {isGenerating ? "…" : "Generate"}
            </Button>
          </div>
          <Select
            value={formData.role_slug}
            onValueChange={(v) => setFormData({ ...formData, role_slug: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              {roles.map((r) => (
                <SelectItem key={r.slug} value={r.slug}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
            {addUserMutation.isPending ? "Creating…" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddUserDialog;
