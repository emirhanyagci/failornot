"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";

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
    <div className="flex flex-col items-center gap-2">
      {label && (
        <div className="font-head text-xs uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
      )}
      <button
        type="button"
        className="flex items-center gap-3 px-5 py-3 bg-primary text-primary-foreground border-2 border-border rounded shadow-md hover:translate-y-[1px] hover:shadow-sm active:translate-y-[2px] active:shadow-none transition-all"
        onClick={handleCopy}
        aria-label="Lobi kodunu kopyala"
      >
        <span className="font-mono text-2xl font-bold tracking-widest">{code}</span>
        <span aria-hidden="true">{copied ? <Check size={20} /> : <Copy size={20} />}</span>
      </button>
    </div>
  );
}
