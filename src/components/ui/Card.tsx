import React, { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "tactical" | "accent" | "warm" | "subtle";
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  variant = "default",
  ...props
}) => {
  const variantStyles = {
    default: "bg-white border border-gray-200 shadow-sm",
    tactical: "bg-white border-2 border-gray-900 shadow-md",
    accent: "bg-white border-2 border-red-500 shadow-sm",
    warm: "bg-amber-50/50 border border-amber-200 shadow-sm",
    subtle: "bg-gray-50 border border-gray-200",
  };

  return (
    <div
      className={cn(
        "rounded-2xl overflow-hidden transition-all duration-150",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => (
  <div
    className={cn(
      "p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between",
      className
    )}
    {...props}
  >
    {children}
  </div>
);

export const CardTitle: React.FC<HTMLAttributes<HTMLHeadingElement>> = ({
  children,
  className,
  ...props
}) => (
  <h3
    className={cn(
      "text-base sm:text-lg font-bold text-gray-900 tracking-tight",
      className
    )}
    {...props}
  >
    {children}
  </h3>
);

export const CardDescription: React.FC<HTMLAttributes<HTMLParagraphElement>> = ({
  children,
  className,
  ...props
}) => (
  <p className={cn("text-xs sm:text-sm text-gray-500 mt-1 leading-relaxed", className)} {...props}>
    {children}
  </p>
);

export const CardContent: React.FC<HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => (
  <div
    className={cn("p-4 sm:p-6 text-sm text-gray-800 leading-relaxed", className)}
    {...props}
  >
    {children}
  </div>
);

export const CardFooter: React.FC<HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => (
  <div
    className={cn(
      "p-4 sm:p-5 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between",
      className
    )}
    {...props}
  >
    {children}
  </div>
);
