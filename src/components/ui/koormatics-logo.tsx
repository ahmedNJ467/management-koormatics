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
        src="/koormatics-logo.png"
        alt="Koormatics Logo"
        className="h-full w-auto object-contain"
        style={{ imageRendering: "auto" }}
        onError={(e) => {
          console.error('Logo failed to load:', e);
          e.currentTarget.style.display = 'none';
        }}
        onLoad={() => console.log('Logo loaded successfully')}
      />
    </div>
  );
};

export default KoormaticsLogo;
