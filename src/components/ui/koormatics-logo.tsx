import React from "react";
import Image from "next/image";

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
        src="/images/Koormatics-logo.png"
        alt="Koormatics Logo"
        width={300}
        height={80}
        className="h-full w-auto object-contain"
        priority
      />
    </div>
  );
};

export default KoormaticsLogo;
