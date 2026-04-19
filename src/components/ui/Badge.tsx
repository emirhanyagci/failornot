import type { ReactNode } from "react";
import { Badge as RetroBadge } from "@/components/retroui/Badge";
import { cn } from "@/lib/utils";

interface BadgeProps {
  children: ReactNode;
  variant?: "neutral" | "primary" | "accent" | "team-a" | "team-b" | "success" | "danger";
}

const variantClasses: Record<NonNullable<BadgeProps["variant"]>, string> = {
  neutral: "bg-muted text-muted-foreground border-2 border-border",
  primary: "bg-primary text-primary-foreground border-2 border-border",
  accent: "bg-accent text-accent-foreground border-2 border-border",
  "team-a": "bg-team-a text-team-a-foreground border-2 border-border",
  "team-b": "bg-team-b text-team-b-foreground border-2 border-border",
  success: "bg-success text-success-foreground border-2 border-border",
  danger: "bg-destructive text-destructive-foreground border-2 border-border",
};

export function Badge({ children, variant = "neutral" }: BadgeProps) {
  return (
    <RetroBadge className={cn("rounded font-head shadow-xs", variantClasses[variant])}>
      {children}
    </RetroBadge>
  );
}
