"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";
import styles from "./LobbyCodeDisplay.module.css";

interface LobbyCodeDisplayProps {
  code: string;
  label?: string;
}

export function LobbyCodeDisplay({ code, label }: LobbyCodeDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Kod kopyalandı");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Kopyalanamadı");
    }
  };

  return (
    <div className={styles.wrap}>
      {label && <div className={styles.label}>{label}</div>}
      <button className={styles.button} onClick={handleCopy} aria-label="Lobi kodunu kopyala">
        <span className={styles.code}>{code}</span>
        <span className={styles.icon}>{copied ? <Check size={18} /> : <Copy size={18} />}</span>
      </button>
    </div>
  );
}
