import React, { memo, useMemo } from "react";

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

// Global logo preload to prevent flickering on navigation
if (typeof window !== "undefined") {
  const preloadLogo = () => {
    // Check if already preloaded
    if (document.querySelector(`link[href="${LOGO_SRC}"]`)) {
      return;
    }
    
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = LOGO_SRC;
    link.crossOrigin = "anonymous";
    document.head.appendChild(link);
    
    // Also preload via Image object for browser cache
    const img = new Image();
    img.src = LOGO_SRC;
  };
  
  // Preload immediately if DOM is ready, otherwise wait
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", preloadLogo);
  } else {
    preloadLogo();
  }
}

const KoormaticsLogoImage = memo(function KoormaticsLogoImage({
  size,
  className,
}: {
  size: LogoSize;
  className?: string;
}) {
  const wrapperHeight = useMemo(() => wrapperHeights[size] ?? wrapperHeights.md, [size]);

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
        key={LOGO_SRC}
      />
    </div>
  );
});

export const KoormaticsLogo = memo(function KoormaticsLogo({
  className = "",
  size = "md",
}: KoormaticsLogoProps) {
  return <KoormaticsLogoImage size={size} className={className} />;
}, (prevProps, nextProps) => {
  // Only re-render if props actually change
  return (
    prevProps.className === nextProps.className &&
    prevProps.size === nextProps.size
  );
});

export default KoormaticsLogo;
