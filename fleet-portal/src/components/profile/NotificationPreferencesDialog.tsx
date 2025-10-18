import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, Mail, Smartphone, Megaphone } from "lucide-react";
import { useProfile, type ProfileData } from "@/hooks/use-profile";

interface NotificationPreferencesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preferences: ProfileData['notification_preferences'];
}

export default function NotificationPreferencesDialog({ 
  open, 
  onOpenChange, 
  preferences 
}: NotificationPreferencesDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [localPreferences, setLocalPreferences] = useState(preferences || {
    email_notifications: true,
    push_notifications: true,
    sms_notifications: false,
    marketing_emails: false,
  });
  
  const { updateNotificationPreferences } = useProfile();

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const success = await updateNotificationPreferences(localPreferences);
      if (success) {
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Error updating notification preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setLocalPreferences(preferences || {
      email_notifications: true,
      push_notifications: true,
      sms_notifications: false,
      marketing_emails: false,
    });
    onOpenChange(false);
  };

  const updatePreference = (key: keyof typeof localPreferences, value: boolean) => {
    setLocalPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </DialogTitle>
          <DialogDescription>
            Choose how you want to be notified about updates and activities.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label htmlFor="email-notifications" className="text-sm font-medium">
                    Email Notifications
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Receive important updates via email
                  </p>
                </div>
              </div>
              <Switch
                id="email-notifications"
                checked={localPreferences.email_notifications}
                onCheckedChange={(checked) => updatePreference('email_notifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label htmlFor="push-notifications" className="text-sm font-medium">
                    Push Notifications
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Get instant notifications in your browser
                  </p>
                </div>
              </div>
              <Switch
                id="push-notifications"
                checked={localPreferences.push_notifications}
                onCheckedChange={(checked) => updatePreference('push_notifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label htmlFor="sms-notifications" className="text-sm font-medium">
                    SMS Notifications
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Receive critical alerts via text message
                  </p>
                </div>
              </div>
              <Switch
                id="sms-notifications"
                checked={localPreferences.sms_notifications}
                onCheckedChange={(checked) => updatePreference('sms_notifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Megaphone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label htmlFor="marketing-emails" className="text-sm font-medium">
                    Marketing Emails
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Receive updates about new features and promotions
                  </p>
                </div>
              </div>
              <Switch
                id="marketing-emails"
                checked={localPreferences.marketing_emails}
                onCheckedChange={(checked) => updatePreference('marketing_emails', checked)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Preferences"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
