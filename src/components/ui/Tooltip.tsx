"use client";

import { useState, type ReactNode } from "react";

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
}

export function Tooltip({ content, children }: TooltipProps) {
  const [open, setOpen] = useState(false);
  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      onClick={() => setOpen((o) => !o)}
    >
      {children}
      {open && (
        <span
          role="tooltip"
          className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded border-2 border-border bg-card text-card-foreground px-2 py-1 text-xs font-head shadow-xs z-50"
        >
          {content}
        </span>
      )}
    </span>
  );
}
