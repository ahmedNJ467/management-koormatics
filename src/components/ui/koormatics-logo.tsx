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

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
    xl: "text-xl",
  };

  // Try to load the PNG image first, fallback to SVG if it fails
  if (!imageError) {
    return (
      <div className={`${sizeClasses[size]} ${className}`}>
        <img
          src="/images/Koormatics-logo.png"
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
        viewBox="0 0 300 80"
        className="h-full w-auto"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background */}
        <rect width="300" height="80" fill="black"/>
        
        {/* K */}
        <text x="20" y="50" fill="#1e3a8a" fontSize="32" fontWeight="bold" fontFamily="serif">
          K
        </text>
        
        {/* Location Pin replacing OO */}
        <g transform="translate(50, 15)">
          {/* Pin body */}
          <path
            d="M15 0 C25 0, 35 10, 35 20 C35 30, 25 40, 15 40 C5 40, -5 30, -5 20 C-5 10, 5 0, 15 0 Z"
            fill="#22c55e"
            stroke="#16a34a"
            strokeWidth="1"
          />
          
          {/* Camel silhouette inside pin */}
          <path
            d="M8 12 C12 8, 18 8, 22 12 C24 14, 24 18, 22 20 C20 22, 18 22, 16 20 C14 18, 12 16, 10 18 C8 20, 6 18, 8 16 Z"
            fill="#1e3a8a"
          />
          
          {/* Camel collar/harness */}
          <path
            d="M10 16 C12 14, 18 14, 20 16"
            stroke="#eab308"
            strokeWidth="2"
            fill="none"
          />
          
          {/* Pin point */}
          <path d="M15 40 L15 60 L10 55 L20 55 Z" fill="#22c55e" />
          
          {/* Target/ripple effect at bottom */}
          <circle cx="15" cy="65" r="3" fill="#eab308" opacity="0.8"/>
          <circle cx="15" cy="65" r="6" fill="#eab308" opacity="0.4"/>
          <circle cx="15" cy="65" r="9" fill="#eab308" opacity="0.2"/>
        </g>
        
        {/* RMATICS */}
        <text x="100" y="50" fill="#1e3a8a" fontSize="32" fontWeight="bold" fontFamily="serif">
          RMATICS
        </text>
        
        {/* Fleet Management subtitle */}
        <text x="20" y="70" fill="white" fontSize="12" fontFamily="Arial, sans-serif" opacity="0.8">
          Fleet Management
        </text>
      </svg>
    </div>
  );
};

export default KoormaticsLogo;
