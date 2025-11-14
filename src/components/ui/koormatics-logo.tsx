import React, { memo, useEffect, useRef, useState } from "react";

interface KoormaticsLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  sticky?: boolean;
}

const sizeMap = {
  sm: { wrapper: "h-8", width: 96, height: 32 },
  md: { wrapper: "h-12", width: 144, height: 48 },
  lg: { wrapper: "h-16", width: 192, height: 64 },
  xl: { wrapper: "h-20", width: 240, height: 80 },
} as const;

type LogoSize = keyof typeof sizeMap;

const LOGO_SRC = "/koormatics-logo.png";

let logoPreloaded = false;
const persistentLogoBySize: Partial<Record<LogoSize, HTMLImageElement>> = {};

const configureImageElement = (
  element: HTMLImageElement,
  sizing: (typeof sizeMap)[LogoSize]
) => {
  element.src = LOGO_SRC;
  element.alt = "Koormatics Logo";
  element.loading = "eager";
  element.decoding = "sync";
  element.fetchPriority = "high";
  element.width = sizing.width;
  element.height = sizing.height;
  element.draggable = false;
  element.className = "h-full w-auto object-contain";
};

const getPersistentLogo = (size: LogoSize) => {
  if (typeof document === "undefined") return null;

  const sizing = sizeMap[size] ?? sizeMap.md;

  if (!persistentLogoBySize[size]) {
    const img = document.createElement("img");
    configureImageElement(img, sizing);
    persistentLogoBySize[size] = img;
  } else {
    configureImageElement(persistentLogoBySize[size]!, sizing);
  }

  return persistentLogoBySize[size]!;
};

export const KoormaticsLogo = memo(function KoormaticsLogo({
  className = "",
  size = "md",
  sticky = false,
}: KoormaticsLogoProps) {
  const sizing = sizeMap[size] ?? sizeMap.md;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hydrated, setHydrated] = useState(false);

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

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!sticky || typeof document === "undefined") {
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    const logoElement = getPersistentLogo(size);
    if (!logoElement) return;

    if (logoElement.parentElement !== container) {
      container.appendChild(logoElement);
    }

    return () => {
      if (logoElement.parentElement === container) {
        container.removeChild(logoElement);
      }
    };
  }, [size, sticky]);

  const Wrapper = (
    <div
      ref={sticky ? containerRef : undefined}
      className={`${sizing.wrapper} ${className}`}
      style={{ minWidth: sizing.width / 2 }}
    >
      {(!sticky || !hydrated) && (
        <img
          src={LOGO_SRC}
          alt="Koormatics Logo"
          loading="eager"
          decoding="sync"
          fetchPriority="high"
          width={sizing.width}
          height={sizing.height}
          className="h-full w-auto object-contain"
          draggable={false}
        />
      )}
    </div>
  );

  return Wrapper;
});

export default KoormaticsLogo;
