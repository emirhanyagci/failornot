"use client";

import { X } from "lucide-react";
import type { WordCard as WordCardType } from "@/types/game";
import { Card } from "@/components/retroui/Card";
import { cn } from "@/lib/utils";

interface WordCardProps {
  card: WordCardType | null;
  hidden?: boolean;
  placeholderText?: string;
  emphasize?: boolean;
}

export function WordCard({ card, hidden, placeholderText, emphasize }: WordCardProps) {
  if (hidden || !card || !card.word) {
    return (
      <Card className="w-full bg-muted">
        <Card.Content className="flex flex-col items-center justify-center text-center gap-3 py-10">
          <span className="text-5xl" aria-hidden="true">
            🤐
          </span>
          <p className="font-head text-muted-foreground">
            {placeholderText ?? "Rakip anlatıyor..."}
          </p>
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full", emphasize && "shadow-xl")}>
      <Card.Content className="flex flex-col items-center gap-4 py-6">
        <div className="font-head text-3xl sm:text-4xl uppercase text-center break-words">
          {card.word}
        </div>
        <div className="w-full h-[2px] bg-border" />
        <div className="flex flex-col gap-2 w-full">
          {card.forbidden.map((w) => (
            <div
              key={w}
              className="flex items-center gap-2 px-3 py-2 border-2 border-border rounded bg-destructive/10 text-destructive font-head capitalize"
            >
              <X size={16} strokeWidth={3} />
              <span>{w}</span>
            </div>
          ))}
        </div>
      </Card.Content>
    </Card>
  );
}
