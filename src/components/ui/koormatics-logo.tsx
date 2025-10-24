import Image from "next/image";
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
      <Image
        src="/koormatics-logo.jpg"
        alt="Koormatics Logo"
        width={120}
        height={40}
        className="h-full w-auto object-contain"
        priority
      />
    </div>
  );
};

export default KoormaticsLogo;
