
import React from "react";

// 支持品牌色渐变环绕动画
export const LoadingSpinner = ({
  size = "md",
  className = "",
  text = "",
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
  text?: string;
}) => {
  const spinnerSize = size === "sm" ? 28 : size === "lg" ? 64 : 44;
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      {/* 圆环渐变动画 */}
      <span
        className="relative animate-spin"
        style={{
          width: spinnerSize,
          height: spinnerSize,
        }}
      >
        <svg
          width={spinnerSize}
          height={spinnerSize}
          viewBox={`0 0 ${spinnerSize} ${spinnerSize}`}
        >
          <circle
            cx={spinnerSize / 2}
            cy={spinnerSize / 2}
            r={spinnerSize / 2 - 6}
            stroke="url(#loading-gradient)"
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={Math.PI * (spinnerSize - 12)}
            strokeDashoffset={Math.PI * (spinnerSize - 12) * 0.25}
          />
          <defs>
            <linearGradient id="loading-gradient" x1="0" y1="0" x2={spinnerSize} y2={spinnerSize}>
              <stop offset="0%" stopColor="#111827" />
              <stop offset="70%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#2dd4bf" />
            </linearGradient>
          </defs>
        </svg>
        {/* 中间光点 */}
        <span
          className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary shadow-lg"
        ></span>
      </span>
      {text && <div className="mt-4 text-muted-foreground text-base font-semibold">{text}</div>}
    </div>
  );
};

