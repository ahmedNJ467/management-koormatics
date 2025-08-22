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
        src="https://www.koormatics.com/wp-content/uploads/2023/09/logo.svg"
        alt="Koormatics Logo"
        className="w-full h-full object-contain"
        style={{ maxWidth: '100%', height: 'auto' }}
      />
    </div>
  );
};

export default KoormaticsLogo;
