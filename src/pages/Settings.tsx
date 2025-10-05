import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User,
  Users,
  Key,
  Save,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  UserPlus,
  Mail,
  Shield,
  Trash2,
  Edit,
} from "lucide-react";

const Settings: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  // State for user creation
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    full_name: "",
    role: "",
  });
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  // State for users list
  const [users, setUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // State for password change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // State for modals
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);
  const [isGeneratingPassword, setIsGeneratingPassword] = useState(false);
  const [showUserPassword, setShowUserPassword] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [updatingUserRole, setUpdatingUserRole] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Available roles
  const userRoles = [
    {
      value: "super_admin",
      label: "Super Administrator",
      description: "Full system access and administration",
    },
    {
      value: "fleet_manager",
      label: "Fleet Manager",
      description: "Manage vehicles and drivers",
    },
    {
      value: "operations_manager",
      label: "Operations Manager",
      description: "Manage trips and operations",
    },
    {
      value: "finance_manager",
      label: "Finance Manager",
      description: "Manage finances and invoices",
    },
  ];

  // Load users from database
  const loadUsers = async () => {
    setIsLoadingUsers(true);
    try {
      // Always use profiles table since vw_user_roles view is broken
      console.log("Loading users from profiles table (view is broken)");
      await loadUsersFromProfiles();
    } catch (error: any) {
      console.error("Error loading users:", error);
      toast({
        title: "Error loading users",
        description: error.message || "Failed to load users.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Fallback method to load users from profiles table
  const loadUsersFromProfiles = async () => {
    try {
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select(
          `
          id,
          email,
          full_name,
          phone,
          created_at
        `
        )
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Get roles for each user
      const usersWithRoles = await Promise.all(
        (profilesData || []).map(async (user) => {
          const { data: userRolesData } = await supabase
            .from("user_roles")
            .select(
              `
              role_slug,
              roles(name)
            `
            )
            .eq("user_id", user.id);

          const userWithRoles = {
            ...user,
            roles: userRolesData?.map((ur: any) => ur.role_slug) || [],
            user_roles:
              userRolesData?.map((ur: any) => ({
                role_slug: ur.role_slug,
                name: ur.roles?.name,
              })) || [],
          };

          console.log("User data from profiles:", userWithRoles);
          return userWithRoles;
        })
      );
      console.log("All users with roles from profiles:", usersWithRoles);
      setUsers(usersWithRoles);
    } catch (error: any) {
      console.error("Error loading users from profiles:", error);
      throw error;
    }
  };

  // Load users on component mount
  React.useEffect(() => {
    loadUsers();
  }, []);

  // Helper function to get role name from slug
  const getRoleName = (roleSlug: string) => {
    const role = userRoles.find((r) => r.value === roleSlug);
    return role?.label || roleSlug;
  };

  // Generate secure password
  const generatePassword = () => {
    setIsGeneratingPassword(true);
    const chars =
      "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars[Math.floor(Math.random() * chars.length)];
    }
    setNewUser((prev) => ({ ...prev, password }));
    setIsGeneratingPassword(false);
  };

  // Delete user function
  const handleDeleteUser = async (userId: string) => {
    if (!userId) return;

    setDeletingUserId(userId);
    try {
      // Delete user using Supabase function
      const { error } = await supabase.functions.invoke("delete-user", {
        body: { user_id: userId },
      });

      if (error) throw error;

      toast({
        title: "User deleted successfully",
        description: "The user has been removed from the system.",
      });

      // Refresh users list
      loadUsers();
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast({
        title: "Error deleting user",
        description:
          error.message || "Failed to delete user. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeletingUserId(null);
    }
  };

  // Update user role function
  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    if (!userId || !newRole) return;

    setUpdatingUserRole(userId);
    try {
      // Update user role using Supabase function
      const { error } = await supabase.functions.invoke("update-user-role", {
        body: {
          user_id: userId,
          role_slug: newRole,
        },
      });

      if (error) throw error;

      toast({
        title: "Role updated successfully",
        description: `User role has been updated to ${
          userRoles.find((r) => r.value === newRole)?.label
        }.`,
      });

      // Refresh users list
      loadUsers();
    } catch (error: any) {
      console.error("Error updating user role:", error);
      toast({
        title: "Error updating role",
        description:
          error.message || "Failed to update user role. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpdatingUserRole(null);
    }
  };

  // Update user profile function
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingUser) return;

    setIsUpdatingProfile(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: editingUser.full_name,
          phone: editingUser.phone,
        })
        .eq("id", editingUser.id);

      if (error) throw error;

      toast({
        title: "Profile updated successfully",
        description: "User profile has been updated.",
      });

      // Close dialog and refresh users list
      setIsEditUserDialogOpen(false);
      setEditingUser(null);
      loadUsers();
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error updating profile",
        description:
          error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Open edit user dialog
  const openEditUserDialog = (user: any) => {
    setEditingUser({ ...user });
    setIsEditUserDialogOpen(true);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !newUser.email ||
      !newUser.password ||
      !newUser.full_name ||
      !newUser.role
    ) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (newUser.password.length < 8) {
      toast({
        title: "Password too short",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingUser(true);
    try {
      console.log("Creating user with data:", {
        email: newUser.email,
        full_name: newUser.full_name,
        role_slug: newUser.role,
      });

      console.log("Supabase client config:", {
        url: supabase.supabaseUrl,
        functionsUrl: supabase.functionsUrl,
      });

      // Use Supabase client with proper configuration
      const { data, error } = await supabase.functions.invoke(
        "create-user-v2",
        {
          body: {
            email: newUser.email,
            password: newUser.password,
            full_name: newUser.full_name,
            role_slug: newUser.role,
          },
        }
      );

      console.log("Function response:", { data, error });

      if (error) throw error;

      toast({
        title: "User created successfully",
        description: `User ${newUser.email} has been created with ${
          userRoles.find((r) => r.value === newUser.role)?.label
        } role.`,
      });

      // Clear form
      setNewUser({
        email: "",
        password: "",
        full_name: "",
        role: "",
      });

      // Close dialog
      setIsCreateUserDialogOpen(false);

      // Refresh users list
      loadUsers();
    } catch (error: any) {
      toast({
        title: "Error creating user",
        description:
          error.message || "Failed to create user. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "New password and confirmation don't match.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: "Password too short",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast({
        title: "Password updated",
        description: "Your password has been changed successfully.",
      });

      // Clear form
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      // Close modal
      setIsPasswordModalOpen(false);
    } catch (error: any) {
      toast({
        title: "Error changing password",
        description:
          error.message || "Failed to change password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Tabs defaultValue="account" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="account">Account Settings</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="space-y-6">
          <div className="grid gap-6">
            {/* Account Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Account Settings
                </CardTitle>
                <CardDescription>
                  Manage your account preferences and security settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Key className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <h4 className="font-medium">Change Password</h4>
                      <p className="text-sm text-muted-foreground">
                        Update your account password
                      </p>
                    </div>
                  </div>
                  <Dialog
                    open={isPasswordModalOpen}
                    onOpenChange={setIsPasswordModalOpen}
                  >
                    <DialogTrigger asChild>
                      <Button variant="outline">Change Password</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Change Password</DialogTitle>
                        <DialogDescription>
                          Update your account password for security
                        </DialogDescription>
                      </DialogHeader>
                      <form
                        onSubmit={handlePasswordChange}
                        className="space-y-4"
                      >
                        <div className="space-y-2">
                          <Label htmlFor="new_password">New Password</Label>
                          <div className="relative">
                            <Input
                              id="new_password"
                              type={showPasswords ? "text" : "password"}
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              placeholder="Enter new password"
                              className="pr-10"
                              required
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowPasswords(!showPasswords)}
                            >
                              {showPasswords ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="confirm_password">
                            Confirm New Password
                          </Label>
                          <div className="relative">
                            <Input
                              id="confirm_password"
                              type={showPasswords ? "text" : "password"}
                              value={confirmPassword}
                              onChange={(e) =>
                                setConfirmPassword(e.target.value)
                              }
                              placeholder="Confirm new password"
                              className="pr-10"
                              required
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowPasswords(!showPasswords)}
                            >
                              {showPasswords ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            Password must be at least 8 characters long and
                            contain a mix of letters, numbers, and symbols.
                          </AlertDescription>
                        </Alert>
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsPasswordModalOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button type="submit" disabled={isChangingPassword}>
                            {isChangingPassword ? (
                              <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            ) : (
                              <Save className="h-4 w-4 mr-2" />
                            )}
                            Change Password
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <h4 className="font-medium">Two-Factor Authentication</h4>
                      <p className="text-sm text-muted-foreground">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                  </div>
                  <Button variant="outline">Enable 2FA</Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <h4 className="font-medium">Notification Preferences</h4>
                      <p className="text-sm text-muted-foreground">
                        Manage your email and push notification preferences
                      </p>
                    </div>
                  </div>
                  <Button variant="outline">Configure</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <div className="grid gap-6">
            {/* User Account Creation */}
            <Card>
              <CardContent className="pt-6">
                <Dialog
                  open={isCreateUserDialogOpen}
                  onOpenChange={(open) => {
                    setIsCreateUserDialogOpen(open);
                    if (open) {
                      generatePassword();
                    }
                  }}
                >
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Create User Account
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[800px]">
                    <DialogHeader>
                      <DialogTitle>Create User Account</DialogTitle>
                      <DialogDescription>
                        Create new user accounts with specific roles and
                        permissions
                      </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleCreateUser} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="user_email">Email Address *</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="user_email"
                              type="email"
                              value={newUser.email}
                              onChange={(e) =>
                                setNewUser((prev) => ({
                                  ...prev,
                                  email: e.target.value,
                                }))
                              }
                              placeholder="user@example.com"
                              className="pl-10"
                              required
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="user_password">Password *</Label>
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input
                                id="user_password"
                                type={showUserPassword ? "text" : "password"}
                                value={newUser.password}
                                onChange={(e) =>
                                  setNewUser((prev) => ({
                                    ...prev,
                                    password: e.target.value,
                                  }))
                                }
                                placeholder="Enter password"
                                className="pl-10 pr-10"
                                required
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() =>
                                  setShowUserPassword(!showUserPassword)
                                }
                              >
                                {showUserPassword ? (
                                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <Eye className="h-4 w-4 text-muted-foreground" />
                                )}
                              </Button>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={generatePassword}
                              disabled={isGeneratingPassword}
                            >
                              {isGeneratingPassword ? "..." : "Generate"}
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="user_name">Full Name *</Label>
                          <div className="relative">
                            <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="user_name"
                              value={newUser.full_name}
                              onChange={(e) =>
                                setNewUser((prev) => ({
                                  ...prev,
                                  full_name: e.target.value,
                                }))
                              }
                              placeholder="Enter full name"
                              className="pl-10"
                              required
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="user_role">Role *</Label>
                          <div className="relative">
                            <Shield className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Select
                              value={newUser.role}
                              onValueChange={(value) =>
                                setNewUser((prev) => ({ ...prev, role: value }))
                              }
                            >
                              <SelectTrigger className="pl-10">
                                <SelectValue placeholder="Select a role" />
                              </SelectTrigger>
                              <SelectContent>
                                {userRoles.map((role) => (
                                  <SelectItem
                                    key={role.value}
                                    value={role.value}
                                  >
                                    <div className="flex flex-col">
                                      <span className="font-medium">
                                        {role.label}
                                      </span>
                                      <span className="text-xs text-muted-foreground">
                                        {role.description}
                                      </span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          The new user will receive an email with login
                          instructions. Password must be at least 8 characters
                          long.
                        </AlertDescription>
                      </Alert>
                    </form>

                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsCreateUserDialogOpen(false)}
                        disabled={isCreatingUser}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        onClick={handleCreateUser}
                        disabled={isCreatingUser}
                      >
                        {isCreatingUser ? (
                          <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        ) : (
                          <UserPlus className="h-4 w-4 mr-2" />
                        )}
                        Create User Account
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* Edit User Dialog */}
                <Dialog
                  open={isEditUserDialogOpen}
                  onOpenChange={setIsEditUserDialogOpen}
                >
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Edit User Profile</DialogTitle>
                      <DialogDescription>
                        Update user profile information
                      </DialogDescription>
                    </DialogHeader>

                    {editingUser && (
                      <form
                        onSubmit={handleUpdateProfile}
                        className="space-y-4"
                      >
                        <div className="space-y-2">
                          <Label htmlFor="edit_full_name">Full Name</Label>
                          <Input
                            id="edit_full_name"
                            value={editingUser.full_name || ""}
                            onChange={(e) =>
                              setEditingUser((prev: any) => ({
                                ...prev,
                                full_name: e.target.value,
                              }))
                            }
                            placeholder="Enter full name"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="edit_email">Email</Label>
                          <Input
                            id="edit_email"
                            value={editingUser.email || ""}
                            disabled
                            className="bg-muted"
                          />
                          <p className="text-xs text-muted-foreground">
                            Email cannot be changed
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="edit_phone">Phone</Label>
                          <Input
                            id="edit_phone"
                            value={editingUser.phone || ""}
                            onChange={(e) =>
                              setEditingUser((prev: any) => ({
                                ...prev,
                                phone: e.target.value,
                              }))
                            }
                            placeholder="Enter phone number"
                          />
                        </div>
                      </form>
                    )}

                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsEditUserDialogOpen(false)}
                        disabled={isUpdatingProfile}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        onClick={handleUpdateProfile}
                        disabled={isUpdatingProfile}
                      >
                        {isUpdatingProfile ? (
                          <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        Update Profile
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            {/* Users Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Existing Users
                </CardTitle>
                <CardDescription>
                  Manage existing users and their roles
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingUsers ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    <span className="ml-2">Loading users...</span>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={7}
                              className="text-center py-8 text-muted-foreground"
                            >
                              No users found
                            </TableCell>
                          </TableRow>
                        ) : (
                          users.map((user: any, index: number) => (
                            <TableRow key={user.id || `user-${index}`}>
                              <TableCell className="font-medium">
                                {user.full_name || "N/A"}
                              </TableCell>
                              <TableCell>{user.email}</TableCell>
                              <TableCell>
                                <Badge variant="secondary">
                                  {user.user_roles?.[0]?.roles?.name ||
                                    getRoleName(
                                      user.roles?.[0] ||
                                        user.user_roles?.[0]?.role_slug ||
                                        ""
                                    ) ||
                                    "No Role"}
                                </Badge>
                              </TableCell>
                              <TableCell>{user.phone || "N/A"}</TableCell>
                              <TableCell>
                                {user.created_at
                                  ? new Date(
                                      user.created_at
                                    ).toLocaleDateString()
                                  : "N/A"}
                              </TableCell>
                              <TableCell>
                                <Badge variant="default">Active</Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Select
                                    value={
                                      user.user_roles?.[0]?.role_slug ||
                                      user.roles?.[0] ||
                                      ""
                                    }
                                    onValueChange={(value) =>
                                      handleUpdateUserRole(user.id, value)
                                    }
                                    disabled={updatingUserRole === user.id}
                                  >
                                    <SelectTrigger className="w-32">
                                      <SelectValue placeholder="Role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {userRoles.map((role) => (
                                        <SelectItem
                                          key={role.value}
                                          value={role.value}
                                        >
                                          {role.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openEditUserDialog(user)}
                                    className="text-blue-600 hover:text-blue-700"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteUser(user.id)}
                                    disabled={deletingUserId === user.id}
                                    className="text-destructive hover:text-destructive"
                                  >
                                    {deletingUserId === user.id ? (
                                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                    ) : (
                                      <Trash2 className="h-4 w-4" />
                                    )}
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
