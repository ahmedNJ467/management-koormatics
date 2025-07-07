import { useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AddUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const roles = [
  { slug: "super_admin", name: "Super Admin" },
  { slug: "manager", name: "Manager" },
  { slug: "staff", name: "Staff" },
  { slug: "viewer", name: "Viewer" },
];

const AddUserDialog: React.FC<AddUserDialogProps> = ({ open, onOpenChange }) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    full_name: "",
    role_slug: "viewer",
  });

  const queryClient = useQueryClient();

  const addUserMutation = useMutation({
    mutationFn: async () => {
      // Call Supabase Edge Function
      const { data, error } = await supabase.functions.invoke("create-user", {
        body: formData,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: "User created" });
      queryClient.invalidateQueries({ queryKey: ["system_users"] });
      onOpenChange(false);
      setFormData({ email: "", password: "", full_name: "", role_slug: "viewer" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          Enter the details for the new account and assign a role.
        </DialogDescription>
        <div className="space-y-4">
          <Input name="full_name" placeholder="Full Name" value={formData.full_name} onChange={handleChange} />
          <Input name="email" placeholder="Email" value={formData.email} onChange={handleChange} type="email" />
          <Input name="password" placeholder="Temp Password" value={formData.password} onChange={handleChange} type="password" />
          <Select value={formData.role_slug} onValueChange={(v)=>setFormData({...formData, role_slug: v})}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {roles.map(r => <SelectItem key={r.slug} value={r.slug}>{r.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={()=>onOpenChange(false)}>Cancel</Button>
          <Button onClick={()=>addUserMutation.mutate()} disabled={addUserMutation.isLoading}>
            {addUserMutation.isLoading ? "Creating..." : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddUserDialog; 