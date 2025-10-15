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

  // For now, always show the SVG logo since the PNG routing issue persists
  return (
    <div className={`${sizeClasses[size]} ${className} flex items-center justify-center`}>
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 200 60"
        className="h-full w-auto"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background circle with gradient */}
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
        
        {/* Background circle */}
        <circle cx="30" cy="30" r="25" fill="url(#logoGradient)" stroke="white" strokeWidth="2"/>
        
        {/* K letter */}
        <path
          d="M20 15 L20 45 M20 30 L35 15 M20 30 L35 45"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Text */}
        <text x="70" y="25" fill="white" fontSize="16" fontWeight="bold" fontFamily="Arial, sans-serif">
          Koormatics
        </text>
        <text x="70" y="40" fill="white" fontSize="10" fontFamily="Arial, sans-serif" opacity="0.8">
          Fleet Management
        </text>
      </svg>
    </div>
  );
};

export default KoormaticsLogo;
