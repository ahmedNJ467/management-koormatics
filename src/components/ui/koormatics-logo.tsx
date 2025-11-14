import React, { memo } from "react";

type LogoSize = "sm" | "md" | "lg" | "xl";

interface KoormaticsLogoProps {
  className?: string;
  size?: LogoSize;
}

const wrapperHeights: Record<LogoSize, string> = {
  sm: "h-8",
  md: "h-10",
  lg: "h-12",
  xl: "h-16",
};

const textSizes: Record<LogoSize, string> = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
  xl: "text-lg",
};

const iconSizes: Record<LogoSize, { width: number; height: number }> = {
  sm: { width: 28, height: 36 },
  md: { width: 32, height: 40 },
  lg: { width: 40, height: 48 },
  xl: { width: 48, height: 56 },
};

const KoormaticsWordmark = ({
  size,
}: {
  size: LogoSize;
}) => {
  const icon = iconSizes[size] ?? iconSizes.md;

  return (
    <div
      className={`flex items-center gap-2 ${wrapperHeights[size] ?? wrapperHeights.md}`}
    >
      <svg
        width={icon.width}
        height={icon.height}
        viewBox="0 0 48 64"
        aria-hidden="true"
        className="shrink-0"
      >
        <defs>
          <linearGradient id="pin-fill" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#c5ff66" />
            <stop offset="100%" stopColor="#7bcf2d" />
          </linearGradient>
        </defs>
        <path
          d="M24 2C12.402 2 3 11.442 3 23.103c0 6.914 3.853 13.396 10.292 20.82 4.61 5.221 9.356 10.03 10.263 11.025a1.99 1.99 0 0 0 2.89 0c0.907-.995 5.653-5.804 10.263-11.026C41.147 36.498 45 30.016 45 23.103 45 11.442 35.598 2 24 2Z"
          fill="url(#pin-fill)"
        />
        <circle cx="24" cy="22" r="9" fill="#0f1e4b" opacity={0.8} />
        <circle cx="24" cy="22" r="5" fill="#fafdff" opacity={0.9} />
      </svg>
      <span
        className={`font-semibold uppercase tracking-[0.45em] text-[#1d2f6b] ${textSizes[size] ?? textSizes.md}`}
      >
        KOORMATICS
      </span>
    </div>
  );
};

export const KoormaticsLogo = memo(function KoormaticsLogo({
  className = "",
  size = "md",
}: KoormaticsLogoProps) {
  return (
    <div className={className}>
      <KoormaticsWordmark size={size} />
    </div>
  );
});

export default KoormaticsLogo;
