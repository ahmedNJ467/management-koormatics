import React, { memo } from "react";

type LogoSize = "sm" | "md" | "lg" | "xl";

interface KoormaticsLogoProps {
  className?: string;
  size?: LogoSize;
}

const LOGO_SRC = "/logo.svg";

const wrapperHeights: Record<LogoSize, string> = {
  sm: "h-8",
  md: "h-10",
  lg: "h-12",
  xl: "h-16",
};

const KoormaticsLogoImage = ({
  size,
  className,
}: {
  size: LogoSize;
  className?: string;
}) => {
  const wrapperHeight = wrapperHeights[size] ?? wrapperHeights.md;

  return (
    <div
      className={`flex items-center ${wrapperHeight} ${className ?? ""}`}
      style={{ minWidth: 140 }}
    >
      <img
        src={LOGO_SRC}
        alt="Koormatics logo"
        loading="eager"
        decoding="sync"
        fetchPriority="high"
        className="h-full w-auto object-contain"
        draggable={false}
        referrerPolicy="no-referrer"
      />
    </div>
  );
};

export const KoormaticsLogo = memo(function KoormaticsLogo({
  className = "",
  size = "md",
}: KoormaticsLogoProps) {
  return <KoormaticsLogoImage size={size} className={className} />;
});

export default KoormaticsLogo;
