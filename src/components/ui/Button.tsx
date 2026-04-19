"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Button as RetroButton } from "@/components/retroui/Button";
import { cn } from "@/lib/utils";

type Variant =
  | "primary"
  | "accent"
  | "ghost"
  | "subtle"
  | "success"
  | "danger"
  | "warning";

type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  icon?: ReactNode;
  loading?: boolean;
}

const variantToRetro: Record<
  Variant,
  { variant: "default" | "secondary" | "outline" | "link" | "ghost"; extra?: string }
> = {
  primary: { variant: "default" },
  accent: {
    variant: "default",
    extra: "bg-accent text-accent-foreground hover:bg-accent/80",
  },
  ghost: { variant: "ghost" },
  subtle: { variant: "outline" },
  success: {
    variant: "default",
    extra: "bg-success text-success-foreground hover:bg-success/80",
  },
  danger: {
    variant: "default",
    extra: "bg-destructive text-destructive-foreground hover:bg-destructive/80",
  },
  warning: {
    variant: "default",
    extra: "bg-warning text-warning-foreground hover:bg-warning/80",
  },
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      fullWidth,
      icon,
      loading,
      className,
      children,
      disabled,
      ...rest
    },
    ref,
  ) => {
    const map = variantToRetro[variant];
    return (
      <RetroButton
        ref={ref}
        variant={map.variant}
        size={size}
        className={cn(
          "justify-center gap-2",
          fullWidth && "w-full",
          loading && "opacity-70 cursor-wait",
          map.extra,
          className,
        )}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...rest}
      >
        {icon && <span className="inline-flex items-center">{icon}</span>}
        <span>{children}</span>
      </RetroButton>
    );
  },
);

Button.displayName = "Button";
