import type { ReactNode } from "react";
import { cls } from "@/lib/utils";
import styles from "./Badge.module.css";

interface BadgeProps {
  children: ReactNode;
  variant?: "neutral" | "primary" | "accent" | "team-a" | "team-b" | "success" | "danger";
}

export function Badge({ children, variant = "neutral" }: BadgeProps) {
  return <span className={cls(styles.badge, styles[variant])}>{children}</span>;
}
