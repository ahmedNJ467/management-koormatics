import React, { useState } from "react";

interface KoormaticsLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export const KoormaticsLogo: React.FC<KoormaticsLogoProps> = ({
  className = "",
  size = "md",
}) => {
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    sm: "h-8",
    md: "h-12",
    lg: "h-16",
    xl: "h-20",
  };

  // Try to load the PNG image first, fallback to SVG if it fails
  if (!imageError) {
    return (
      <div className={`${sizeClasses[size]} ${className}`}>
        <img
          src="/api/logo"
          alt="Koormatics Logo"
          className="h-full w-auto object-contain"
          onError={() => {
            console.error("Logo failed to load, showing SVG fallback");
            setImageError(true);
          }}
          onLoad={() => {
            console.log("Logo loaded successfully");
          }}
        />
      </div>
    );
  }

  // SVG fallback that matches the actual Koormatics logo design
  return (
    <div className={`${sizeClasses[size]} ${className} flex items-center justify-center`}>
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 400 100"
        className="h-full w-auto"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* K */}
        <text
          x="20"
          y="60"
          fill="#1e3a8a"
          fontSize="40"
          fontWeight="bold"
          fontFamily="serif"
        >
          K
        </text>

        {/* Location Pin replacing OO */}
        <g transform="translate(70, 20)">
          {/* Pin body - more accurate shape */}
          <path
            d="M20 0 C35 0, 50 15, 50 30 C50 45, 35 60, 20 60 C5 60, -10 45, -10 30 C-10 15, 5 0, 20 0 Z"
            fill="#22c55e"
            stroke="#16a34a"
            strokeWidth="2"
          />

          {/* Camel silhouette inside pin - more detailed */}
          <path
            d="M10 15 C15 10, 25 10, 30 15 C32 17, 32 22, 30 24 C28 26, 25 26, 22 24 C20 22, 18 20, 15 22 C12 24, 8 22, 10 20 Z"
            fill="#1e3a8a"
          />

          {/* Camel details */}
          <circle cx="20" cy="18" r="2" fill="#1e3a8a" />
          <path d="M15 20 L25 20" stroke="#1e3a8a" strokeWidth="1" />

          {/* Pin point */}
          <path d="M20 60 L20 80 L15 75 L25 75 Z" fill="#22c55e" />

          {/* Target/ripple effect at bottom */}
          <circle cx="20" cy="85" r="4" fill="#eab308" opacity="0.9"/>
          <circle cx="20" cy="85" r="8" fill="#eab308" opacity="0.5"/>
          <circle cx="20" cy="85" r="12" fill="#eab308" opacity="0.3"/>
        </g>

        {/* RMATICS */}
        <text
          x="130"
          y="60"
          fill="#1e3a8a"
          fontSize="40"
          fontWeight="bold"
          fontFamily="serif"
        >
          RMATICS
        </text>

        {/* Fleet Management subtitle */}
        <text
          x="20"
          y="85"
          fill="white"
          fontSize="14"
          fontFamily="Arial, sans-serif"
          opacity="0.9"
        >
          Fleet Management
        </text>
      </svg>
    </div>
  );
};

export default KoormaticsLogo;