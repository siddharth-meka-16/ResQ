import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg" | "icon";

const variants: Record<Variant, string> = {
  primary:
    "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)] disabled:opacity-50 shadow-sm",
  secondary:
    "bg-white border border-gray-200 text-gray-800 hover:bg-gray-50 disabled:opacity-50 shadow-xs",
  outline:
    "bg-transparent border border-gray-300 text-gray-800 hover:bg-gray-100 disabled:opacity-50",
  ghost: "text-gray-600 hover:bg-gray-100 disabled:opacity-50",
  danger:
    "bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 shadow-sm",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
  icon: "h-9 w-9 p-0",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className = "", ...props }, ref) => (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-150 cursor-pointer active:scale-[0.98] disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  )
);

Button.displayName = "Button";
