import Image from "next/image";
import React, { useMemo } from "react";

interface KoormaticsLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeMap = {
  sm: { wrapper: "h-8", width: 104, height: 32 },
  md: { wrapper: "h-12", width: 156, height: 48 },
  lg: { wrapper: "h-16", width: 208, height: 64 },
  xl: { wrapper: "h-20", width: 260, height: 80 },
} as const;

let logoLoadedOnce = false;

export const KoormaticsLogo: React.FC<KoormaticsLogoProps> = ({
  className = "",
  size = "md",
}) => {
  const sizing = sizeMap[size] ?? sizeMap.md;

  const priority = useMemo(() => {
    if (logoLoadedOnce) return false;
    logoLoadedOnce = true;
    return true;
  }, []);

  return (
    <div className={`${sizing.wrapper} ${className}`}>
      <Image
        src="/koormatics-logo.jpg"
        alt="Koormatics Logo"
        width={sizing.width}
        height={sizing.height}
        priority={priority}
        fetchPriority="high"
        className="h-full w-auto object-contain"
      />
    </div>
  );
};

export default KoormaticsLogo;
