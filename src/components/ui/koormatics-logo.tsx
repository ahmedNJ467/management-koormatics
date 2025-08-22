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
      <svg
        viewBox="0 0 300 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* K */}
        <path
          d="M10 10 L10 70 L25 70 L45 45 L65 70 L80 70 L55 40 L80 10 L65 10 L45 35 L25 10 Z"
          fill="#1e3a8a"
        />

        {/* O with Location Pin */}
        <g>
          {/* Location Pin Circle (replaces O) */}
          <circle cx="130" cy="40" r="20" fill="#84cc16" />

          {/* Camel Silhouette */}
          <path
            d="M125 35 Q125 30 130 30 Q135 30 135 35 L135 40 Q135 45 130 45 Q125 45 125 40 Z"
            fill="#1e3a8a"
          />

          {/* Camel Hump */}
          <path
            d="M125 35 Q130 32 135 35"
            stroke="#1e3a8a"
            strokeWidth="2"
            fill="none"
          />

          {/* Location Pin Tip */}
          <path d="M130 60 L125 70 L135 70 Z" fill="#84cc16" />

          {/* Ripple Rings */}
          <circle
            cx="130"
            cy="40"
            r="25"
            stroke="#84cc16"
            strokeWidth="1"
            fill="none"
            opacity="0.6"
          />
          <circle
            cx="130"
            cy="40"
            r="30"
            stroke="#eab308"
            strokeWidth="1"
            fill="none"
            opacity="0.4"
          />
          <circle
            cx="130"
            cy="40"
            r="35"
            stroke="#84cc16"
            strokeWidth="1"
            fill="none"
            opacity="0.3"
          />
        </g>

        {/* RMATICS */}
        <path
          d="M160 10 L160 70 L175 70 L175 25 L190 25 L190 10 Z"
          fill="#1e3a8a"
        />
        <path
          d="M200 10 L200 70 L215 70 L215 25 L230 25 L230 10 Z"
          fill="#1e3a8a"
        />
        <path
          d="M240 10 L240 70 L255 70 L255 25 L270 25 L270 10 Z"
          fill="#1e3a8a"
        />
        <path
          d="M280 10 L280 70 L295 70 L295 25 L310 25 L310 10 Z"
          fill="#1e3a8a"
        />
        <path
          d="M320 10 L320 70 L335 70 L335 25 L350 25 L350 10 Z"
          fill="#1e3a8a"
        />
        <path
          d="M360 10 L360 70 L375 70 L375 25 L390 25 L390 10 Z"
          fill="#1e3a8a"
        />
        <path
          d="M400 10 L400 70 L415 70 L415 25 L430 25 L430 10 Z"
          fill="#1e3a8a"
        />
      </svg>
    </div>
  );
};

export default KoormaticsLogo;
