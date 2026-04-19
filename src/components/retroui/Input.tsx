import React, { forwardRef, InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { type = "text", placeholder = "Enter text", className = "", ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      type={type}
      placeholder={placeholder}
      className={cn(
        "px-4 py-2 w-full rounded border-2 shadow-md transition focus:outline-hidden focus:shadow-xs bg-card text-card-foreground placeholder:text-muted-foreground",
        props["aria-invalid"]
          ? "border-destructive text-destructive shadow-xs shadow-destructive"
          : "border-border",
        className,
      )}
      {...props}
    />
  );
});
