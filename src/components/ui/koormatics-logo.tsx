import React from "react";

interface KoormaticsLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeMap = {
  sm: "h-8",
  md: "h-12",
  lg: "h-16",
  xl: "h-20",
} as const;

export const KoormaticsLogo: React.FC<KoormaticsLogoProps> = ({
  className = "",
  size = "md",
}) => {
  const wrapperClass = sizeMap[size] ?? sizeMap.md;

  return (
    <div className={`${wrapperClass} ${className}`}>
      <img
        src="/koormatics-logo.png"
        alt="Koormatics Logo"
        loading="eager"
        decoding="sync"
        fetchpriority="high"
        className="h-full w-auto object-contain"
        draggable={false}
      />
    </div>
  );
};

export default KoormaticsLogo;
