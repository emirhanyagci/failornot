"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import styles from "./Input.module.css";
import { cls } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
  mono?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, label, mono, className, ...rest }, ref) => (
    <label className={styles.wrap}>
      {label && <span className={styles.label}>{label}</span>}
      <input
        ref={ref}
        className={cls(styles.input, error && styles.hasError, mono && styles.mono, className)}
        {...rest}
      />
      {error && <span className={styles.error}>{error}</span>}
    </label>
  ),
);

Input.displayName = "Input";
