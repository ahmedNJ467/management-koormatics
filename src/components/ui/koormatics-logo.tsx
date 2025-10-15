import React, { useState } from "react";
import Image from "next/image";

interface KoormaticsLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export const KoormaticsLogo: React.FC<KoormaticsLogoProps> = ({
  className = "",
  size = "md",
}) => {
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    sm: "h-8",
    md: "h-12",
    lg: "h-16",
    xl: "h-20",
  };

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
    xl: "text-xl",
  };

  if (imageError) {
    return (
      <div className={`${sizeClasses[size]} ${className} flex items-center justify-center`}>
        <span className={`text-white font-bold ${textSizeClasses[size]} drop-shadow-lg`}>
          KOORMATICS
        </span>
      </div>
    );
  }

  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      <Image
        src="/images/Koormatics-logo.png"
        alt="Koormatics Logo"
        width={300}
        height={80}
        className="h-full w-auto object-contain"
        priority
        unoptimized
        onError={() => {
          console.error("Logo failed to load, showing text fallback");
          setImageError(true);
        }}
        onLoad={() => {
          console.log("Logo loaded successfully");
        }}
      />
    </div>
  );
};

export default KoormaticsLogo;
