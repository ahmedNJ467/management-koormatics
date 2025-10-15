import React, { useState } from "react";

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
          Koormatics
        </span>
      </div>
    );
  }

  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      <img
        src="/images/Koormatics-logo.png"
        alt="Koormatics Logo"
        className="h-full w-auto object-contain"
        onError={(e) => {
          console.error("Logo failed to load:", e);
          console.error("Image src:", "/images/Koormatics-logo.png");
          console.error("Image target:", e.target);
          console.error("Current URL:", window.location.href);
          setImageError(true);
        }}
        onLoad={() => {
          console.log("Logo loaded successfully");
        }}
        crossOrigin="anonymous"
      />
    </div>
  );
};

export default KoormaticsLogo;
