"use client";

import { Check, Flag, SkipForward } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";

interface ActionBarProps {
  onCorrect: () => void;
  onPass: () => void;
  onFoul: () => void;
  passesRemaining: number;
  passLimit: number;
  disabled?: boolean;
  disablePass?: boolean;
}

export function ActionBar({
  onCorrect,
  onPass,
  onFoul,
  passesRemaining,
  passLimit,
  disabled,
  disablePass,
}: ActionBarProps) {
  const t = useTranslations("game");
  return (
    <div className="flex flex-col sm:flex-row gap-2 w-full">
      <Button
        variant="success"
        fullWidth
        onClick={onCorrect}
        disabled={disabled}
        icon={<Check size={20} />}
      >
        {t("correct")}
      </Button>
      <Button
        variant="warning"
        fullWidth
        onClick={onPass}
        disabled={disabled || disablePass || passesRemaining <= 0}
        icon={<SkipForward size={20} />}
      >
        {t("pass")} ({passesRemaining}/{passLimit})
      </Button>
      <Button
        variant="danger"
        fullWidth
        onClick={onFoul}
        disabled={disabled}
        icon={<Flag size={20} />}
      >
        {t("foul")}
      </Button>
    </div>
  );
}
