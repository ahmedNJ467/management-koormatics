
import { Image, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface AvatarUploadFieldProps {
  avatarPreview: string | null;
  onAvatarChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function AvatarUploadField({ avatarPreview, onAvatarChange }: AvatarUploadFieldProps) {
  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative h-24 w-24 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
        {avatarPreview ? (
          <img
            src={avatarPreview}
            alt="Avatar preview"
            className="h-full w-full object-cover"
          />
        ) : (
          <Image className="h-8 w-8 text-gray-400" />
        )}
      </div>
      <div className="flex items-center space-x-2">
        <Input
          type="file"
          accept="image/*"
          onChange={onAvatarChange}
          className="hidden"
          id="avatar-upload"
        />
        <label
          htmlFor="avatar-upload"
          className="flex items-center space-x-2 px-4 py-2 border rounded-md cursor-pointer hover:bg-gray-50"
        >
          <Upload className="h-4 w-4" />
          <span>Upload Avatar</span>
        </label>
      </div>
    </div>
  );
}
