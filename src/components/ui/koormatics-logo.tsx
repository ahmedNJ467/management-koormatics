import React, { memo, useEffect } from "react";

interface KoormaticsLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeMap = {
  sm: { wrapper: "h-8", width: 96, height: 32 },
  md: { wrapper: "h-12", width: 144, height: 48 },
  lg: { wrapper: "h-16", width: 192, height: 64 },
  xl: { wrapper: "h-20", width: 240, height: 80 },
} as const;

let logoPreloaded = false;

export const KoormaticsLogo = memo(function KoormaticsLogo({
  className = "",
  size = "md",
}: KoormaticsLogoProps) {
  const sizing = sizeMap[size] ?? sizeMap.md;

  useEffect(() => {
    if (logoPreloaded || typeof document === "undefined") {
      return;
    }

    const existing = document.querySelector(
      'link[data-koormatics-logo-preload="true"]'
    );

    if (!existing) {
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "image";
      link.href = "/koormatics-logo.png";
      link.setAttribute("data-koormatics-logo-preload", "true");
      document.head.appendChild(link);
    }

    logoPreloaded = true;
  }, []);

  return (
    <div
      className={`${sizing.wrapper} ${className}`}
      style={{ minWidth: sizing.width / 2 }}
    >
      <img
        src="/koormatics-logo.png"
        alt="Koormatics Logo"
        loading="eager"
        decoding="sync"
        fetchPriority="high"
        width={sizing.width}
        height={sizing.height}
        className="h-full w-auto object-contain"
        draggable={false}
      />
    </div>
  );
});

export default KoormaticsLogo;
