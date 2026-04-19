"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { Input as RetroInput } from "@/components/retroui/Input";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
  mono?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, label, mono, className, id, ...rest }, ref) => {
    const inputId = id ?? (label ? `input-${label.replace(/\s+/g, "-").toLowerCase()}` : undefined);
    return (
      <label className="flex flex-col gap-1.5 w-full" htmlFor={inputId}>
        {label && <span className="font-head text-sm">{label}</span>}
        <RetroInput
          ref={ref}
          id={inputId}
          aria-invalid={Boolean(error) || undefined}
          aria-errormessage={error ? `${inputId}-error` : undefined}
          className={cn(mono && "font-mono tracking-wider", className)}
          {...rest}
        />
        {error && (
          <span
            id={inputId ? `${inputId}-error` : undefined}
            className="text-xs text-destructive font-medium"
          >
            {error}
          </span>
        )}
      </label>
    );
  },
);

Input.displayName = "Input";
