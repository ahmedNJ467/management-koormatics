import { Image, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";

interface AvatarUploadFieldProps {
  avatarPreview: string | null;
  onAvatarChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onAvatarClear: () => void;
  canClear?: boolean;
}

export function AvatarUploadField({
  avatarPreview,
  onAvatarChange,
  onAvatarClear,
  canClear = false,
}: AvatarUploadFieldProps) {
  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative h-32 w-32 rounded-full border-2 border-dashed border-border/50 flex items-center justify-center overflow-hidden bg-muted/20">
        {avatarPreview ? (
          <img
            src={avatarPreview}
            alt="Avatar preview"
            className="h-full w-full object-cover"
          />
        ) : (
          <Image className="h-8 w-8 text-muted-foreground" />
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
          className="flex items-center space-x-2 px-4 py-2 rounded-md border border-border/50 cursor-pointer bg-transparent hover:bg-muted/50 text-foreground"
        >
          <Upload className="h-4 w-4" />
          <span>{avatarPreview ? "Change Avatar" : "Upload Avatar"}</span>
        </label>
        {canClear && (
          <button
            type="button"
            onClick={onAvatarClear}
            className="text-sm text-destructive hover:underline"
          >
            Remove
          </button>
        )}
      </div>
    </div>
  );
}
