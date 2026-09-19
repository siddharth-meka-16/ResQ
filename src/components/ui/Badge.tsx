import React from "react";

const severityStyles: Record<string, string> = {
  CRITICAL: "bg-red-100 text-red-700 border-red-200",
  EXTREME: "bg-red-100 text-red-700 border-red-200",
  HIGH: "bg-orange-100 text-orange-700 border-orange-200",
  SEVERE: "bg-orange-100 text-orange-700 border-orange-200",
  MEDIUM: "bg-amber-100 text-amber-700 border-amber-200",
  MODERATE: "bg-amber-100 text-amber-700 border-amber-200",
  LOW: "bg-green-100 text-green-700 border-green-200",
  MINOR: "bg-green-100 text-green-700 border-green-200",
  AVAILABLE: "bg-green-100 text-green-700 border-green-200",
  OPEN: "bg-green-100 text-green-700 border-green-200",
  ASSIGNED: "bg-blue-100 text-blue-700 border-blue-200",
  EN_ROUTE: "bg-blue-100 text-blue-700 border-blue-200",
  ON_SCENE: "bg-purple-100 text-purple-700 border-purple-200",
  RESOLVED: "bg-gray-100 text-gray-600 border-gray-200",
  COMPLETED: "bg-gray-100 text-gray-600 border-gray-200",
  UNAVAILABLE: "bg-gray-200 text-gray-500 border-gray-300",
  FILLING: "bg-amber-100 text-amber-700 border-amber-200",
  NEAR_CAPACITY: "bg-orange-100 text-orange-700 border-orange-200",
  FULL: "bg-red-100 text-red-700 border-red-200",
  CAUTION: "bg-amber-100 text-amber-700 border-amber-200",
  NORMAL: "bg-green-100 text-green-700 border-green-200",
  DIVERT_ALL: "bg-red-600 text-white border-red-700",
};

export interface BadgeProps {
  children?: React.ReactNode;
  label?: string;
  color?: string;
  variant?: string;
  className?: string;
}

export function Badge({
  children,
  label,
  color,
  variant,
  className = "",
}: BadgeProps) {
  const key = color || variant || (typeof children === "string" ? children : "");
  const style =
    severityStyles[key.toUpperCase()] ||
    "bg-gray-100 text-gray-700 border-gray-200";

  const content = children !== undefined ? children : (label ? label.replace(/_/g, " ") : "");

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide ${style} ${className}`}
    >
      {content}
    </span>
  );
}
