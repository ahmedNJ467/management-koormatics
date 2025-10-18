import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Camera,
  Upload,
  X,
  Eye,
  Download,
  ImageIcon,
  AlertCircle,
  FileImage,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface UploadedImage {
  id: string;
  file: File;
  preview: string;
  name: string;
  size: number;
  type: string;
}

interface ImageUploadProps {
  value: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
  maxImages?: number;
  maxFileSize?: number; // in MB
  className?: string;
}

export function ImageUpload({
  value,
  onChange,
  maxImages = 10,
  maxFileSize = 5,
  className,
}: ImageUploadProps) {
  const { toast } = useToast();
  const [previewImage, setPreviewImage] = useState<UploadedImage | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      // Handle rejected files
      if (rejectedFiles.length > 0) {
        const reasons = rejectedFiles
          .map((file) => file.errors[0]?.message)
          .join(", ");
        toast({
          title: "Some files were rejected",
          description: reasons,
          variant: "destructive",
        });
      }

      // Check if adding these files would exceed the maximum
      if (value.length + acceptedFiles.length > maxImages) {
        toast({
          title: "Too many images",
          description: `Maximum ${maxImages} images allowed. ${
            maxImages - value.length
          } slots remaining.`,
          variant: "destructive",
        });
        return;
      }

      // Process accepted files
      const newImages: UploadedImage[] = acceptedFiles.map((file) => ({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        preview: URL.createObjectURL(file),
        name: file.name,
        size: file.size,
        type: file.type,
      }));

      onChange([...value, ...newImages]);

      if (newImages.length > 0) {
        toast({
          title: "Images uploaded",
          description: `${newImages.length} image(s) added successfully.`,
        });
      }
    },
    [value, onChange, maxImages, toast]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif", ".bmp", ".webp"],
    },
    maxSize: maxFileSize * 1024 * 1024, // Convert MB to bytes
    disabled: value.length >= maxImages,
  });

  const removeImage = (imageId: string) => {
    const imageToRemove = value.find((img) => img.id === imageId);
    if (imageToRemove) {
      URL.revokeObjectURL(imageToRemove.preview);
      onChange(value.filter((img) => img.id !== imageId));

      toast({
        title: "Image removed",
        description: "Image has been removed from the incident report.",
      });
    }
  };

  const downloadImage = (image: UploadedImage) => {
    const link = document.createElement("a");
    link.href = image.preview;
    link.download = image.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const openPreview = (image: UploadedImage) => {
    setPreviewImage(image);
  };

  const closePreview = () => {
    setPreviewImage(null);
  };

  const isUploadDisabled = value.length >= maxImages;

  return (
    <>
      <Card className={className}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Incident Photos
            </CardTitle>
            <Badge variant="outline">
              {value.length}/{maxImages} images
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Upload Area */}
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
              isDragActive
                ? "border-primary bg-primary/5"
                : "border-gray-300 hover:border-gray-400",
              isUploadDisabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <input {...getInputProps()} disabled={isUploadDisabled} />
            <div className="flex flex-col items-center gap-2">
              {isDragActive ? (
                <>
                  <Upload className="h-10 w-10 text-primary" />
                  <p className="text-sm font-medium text-primary">
                    Drop images here...
                  </p>
                </>
              ) : (
                <>
                  <ImageIcon className="h-10 w-10 text-gray-400" />
                  <p className="text-sm font-medium text-gray-700">
                    {isUploadDisabled
                      ? "Maximum images reached"
                      : "Drop images here or click to upload"}
                  </p>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, GIF up to {maxFileSize}MB each
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="flex items-start gap-2 p-3 bg-yellow-50 rounded-lg">
            <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-1">Photo Guidelines:</p>
              <ul className="text-xs space-y-1">
                <li>• Take photos from multiple angles</li>
                <li>• Include close-ups of damage details</li>
                <li>• Capture the overall scene and surroundings</li>
                <li>• Include photos of other vehicles if involved</li>
                <li>• Document any relevant road signs or conditions</li>
              </ul>
            </div>
          </div>

          {/* Uploaded Images Grid */}
          {value.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium">
                Uploaded Images ({value.length})
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {value.map((image) => (
                  <div
                    key={image.id}
                    className="relative group border rounded-lg overflow-hidden bg-gray-50"
                  >
                    {/* Image Preview */}
                    <div className="aspect-square relative">
                      <img
                        src={image.preview}
                        alt={image.name}
                        className="w-full h-full object-cover"
                      />

                      {/* Overlay with actions */}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => openPreview(image)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => downloadImage(image)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeImage(image.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Image Info */}
                    <div className="p-2">
                      <p
                        className="text-xs font-medium truncate"
                        title={image.name}
                      >
                        {image.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(image.size)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {value.length === 0 && (
            <div className="text-center py-8">
              <FileImage className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No images uploaded yet</p>
              <p className="text-xs text-gray-400">
                Add photos to document the incident details
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Image Preview Dialog */}
      <Dialog open={!!previewImage} onOpenChange={() => closePreview()}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Image Preview
            </DialogTitle>
            <DialogDescription>
              {previewImage?.name} -{" "}
              {previewImage && formatFileSize(previewImage.size)}
            </DialogDescription>
          </DialogHeader>

          {previewImage && (
            <div className="flex justify-center">
              <img
                src={previewImage.preview}
                alt={previewImage.name}
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
              />
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => previewImage && downloadImage(previewImage)}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (previewImage) {
                  removeImage(previewImage.id);
                  closePreview();
                }
              }}
            >
              <X className="h-4 w-4 mr-2" />
              Remove
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
