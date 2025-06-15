
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Camera, Save, User, Mail, Phone, MapPin, Building, Wand2 } from "lucide-react";
import { useProfile, type ProfileData } from "@/hooks/use-profile";
import { toast } from "sonner";
import { removeBackground, loadImage, blobToDataURL } from "@/utils/image-processing";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
  address: z.string().optional(),
  company: z.string().optional(),
  bio: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function Profile() {
  const { profile, loading, saveProfile, uploadProfileImage } = useProfile();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRemovingBackground, setIsRemovingBackground] = useState(false);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      company: "",
      bio: "",
    },
  });

  // Update form when profile loads
  useEffect(() => {
    if (profile) {
      form.reset({
        name: profile.name,
        email: profile.email,
        phone: profile.phone || "",
        address: profile.address || "",
        company: profile.company || "",
        bio: profile.bio || "",
      });
      setProfileImage(profile.profile_image_url);
    }
  }, [profile, form]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const imageUrl = await uploadProfileImage(file);
        setProfileImage(imageUrl);
      } catch (error) {
        console.error('Error uploading image:', error);
      }
    }
  };

  const handleRemoveBackground = async () => {
    if (!profileImage) return;

    setIsRemovingBackground(true);
    toast.info("Starting background removal...", {
      description: "This may take a moment as the AI model loads.",
    });

    try {
      const blob = await (await fetch(profileImage)).blob();
      const imageElement = await loadImage(blob);
      
      toast.info("Processing image...", {
        description: "The AI is analyzing the image to find the background.",
      });

      const resultBlob = await removeBackground(imageElement);
      const resultDataUrl = await blobToDataURL(resultBlob);
      
      setProfileImage(resultDataUrl);
      toast.success("Background removed successfully!");
    } catch (error) {
      console.error("Error removing background:", error);
      toast.error("Failed to remove background.", {
        description: "Please try again or use a different image.",
      });
    } finally {
      setIsRemovingBackground(false);
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true);
    try {
      const profileData: ProfileData = {
        name: data.name,
        email: data.email,
        phone: data.phone || "",
        address: data.address || "",
        company: data.company || "",
        bio: data.bio || "",
        profile_image_url: profileImage,
      };
      
      await saveProfile(profileData);
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
      <div>
        <h2 className="text-3xl font-semibold tracking-tight">Profile Settings</h2>
        <p className="text-muted-foreground">Manage your account information and preferences</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Picture Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Profile Picture
            </CardTitle>
            <CardDescription>
              Update your profile picture
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profileImage || "/placeholder.svg"} alt="Profile" />
                <AvatarFallback className="text-lg">
                  {profile?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'AD'}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex flex-col space-y-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="profile-upload"
                />
                <label
                  htmlFor="profile-upload"
                  className="flex items-center justify-center space-x-2 px-4 py-2 border rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <Camera className="h-4 w-4" />
                  <span>Change Photo</span>
                </label>
                
                {profileImage && (
                  <div className="flex w-full items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setProfileImage(null)}
                      className="flex-1"
                    >
                      Remove
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveBackground}
                      disabled={isRemovingBackground}
                      className="flex-1"
                    >
                      {isRemovingBackground ? (
                        <span className="animate-pulse">Processing...</span>
                      ) : (
                        <>
                          <Wand2 className="h-4 w-4 mr-2" />
                          Remove BG
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Information */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
              <CardDescription>
                Update your personal details and contact information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Full Name
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your full name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            Email Address
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your email" type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            Phone Number
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your phone number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="company"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Building className="h-4 w-4" />
                            Company
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your company" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Address
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bio</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Tell us a little about yourself"
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Separator />

                  <div className="flex justify-end">
                    <Button type="submit" disabled={isLoading}>
                      <Save className="h-4 w-4 mr-2" />
                      {isLoading ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Account Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
          <CardDescription>
            Manage your account preferences and security settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">Change Password</h4>
                <p className="text-sm text-muted-foreground">
                  Update your account password
                </p>
              </div>
              <Button variant="outline">Change Password</Button>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">Two-Factor Authentication</h4>
                <p className="text-sm text-muted-foreground">
                  Add an extra layer of security to your account
                </p>
              </div>
              <Button variant="outline">Enable 2FA</Button>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">Email Notifications</h4>
                <p className="text-sm text-muted-foreground">
                  Manage your email notification preferences
                </p>
              </div>
              <Button variant="outline">Configure</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
