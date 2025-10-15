import React from "react";

interface KoormaticsLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export const KoormaticsLogo: React.FC<KoormaticsLogoProps> = ({
  className = "",
  size = "md",
}) => {
  const sizeClasses = {
    sm: "h-8",
    md: "h-12",
    lg: "h-16",
    xl: "h-20",
  };

  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      <img
        src="/logo"
        alt="Koormatics Logo"
        className="h-full w-auto object-contain"
        onLoad={() => {
          console.log("Logo loaded successfully");
        }}
      />
    </div>
  );
};

export default KoormaticsLogo;