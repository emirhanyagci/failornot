"use client";

import { useState } from "react";
import { ArrowLeft, Info, Rocket, Shuffle } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Tooltip } from "@/components/ui/Tooltip";
import { Card } from "@/components/retroui/Card";
import { useRouter } from "@/lib/i18n/routing";
import { generateLobbyCode, cn } from "@/lib/utils";
import type { GameMode, LobbySettings } from "@/types/game";

const CATEGORY_SLUGS = ["genel", "karisik", "oyun", "spor", "bilim", "tarih"] as const;
const MODES: GameMode[] = ["normal", "sudden_death", "bomb"];

export function CreateLobbyForm() {
  const t = useTranslations("create");
  const tCommon = useTranslations("common");
  const router = useRouter();

  const [mode, setMode] = useState<GameMode>("normal");
  const [categorySlugs, setCategorySlugs] = useState<string[]>(["genel"]);
  const [roundTime, setRoundTime] = useState(60);
  const [bombTime, setBombTime] = useState(30);
  const [targetScore, setTargetScore] = useState(30);
  const [passLimit, setPassLimit] = useState(3);
  const [isPublic, setIsPublic] = useState(false);

  // Bomba modunda tüm kelime havuzu (karışık) kullanılır; kategori seçimi
  // anlamsız olduğu için UI'dan gizlenir ve settings'te sabitlenir.
  const isBomb = mode === "bomb";
  const effectiveCategorySlugs = isBomb ? ["karisik"] : categorySlugs;

  const handleModeChange = (m: GameMode) => {
    setMode(m);
    if (m === "bomb") setTargetScore((prev) => Math.min(Math.max(prev, 3), 10));
    else if (m === "normal") setTargetScore((prev) => Math.max(prev, 10));
  };

  const toggleCategory = (slug: string) => {
    setCategorySlugs((prev) => {
      if (prev.includes(slug)) {
        return prev.length > 1 ? prev.filter((s) => s !== slug) : prev;
      }
      return [...prev, slug];
    });
  };

  const handleCreate = () => {
    const code = generateLobbyCode();
    const settings: LobbySettings = {
      mode,
      categorySlugs: effectiveCategorySlugs,
      roundTime,
      bombTime,
      targetScore,
      passLimit,
      isPublic,
      maxPlayers: 8,
    };
    sessionStorage.setItem(`faulornot.settings.${code}`, JSON.stringify(settings));
    sessionStorage.setItem(`faulornot.host.${code}`, "1");
    router.push(`/${code}` as "/");
  };

  return (
    <div className="w-full max-w-md flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 mt-2">
        <Button variant="subtle" icon={<ArrowLeft size={18} />} onClick={() => router.back()}>
          {tCommon("back")}
        </Button>
        <h2 className="font-head text-xl flex-1 text-center">{t("title")}</h2>
        <div className="w-12" />
      </div>

      <Card className="w-full">
        <Card.Content className="flex flex-col gap-3">
          <SectionTitle>{t("gameMode")}</SectionTitle>
          <div className="flex flex-col gap-2">
            {MODES.map((m) => (
              <button
                key={m}
                type="button"
                className={cn(
                  "text-left bg-card border-2 border-border rounded p-3 transition-all shadow-xs",
                  "hover:translate-y-[1px] hover:shadow-none",
                  mode === m && "bg-accent shadow-md",
                )}
                onClick={() => handleModeChange(m)}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={cn(
                      "w-4 h-4 rounded-full border-2 border-border shrink-0",
                      mode === m && "bg-primary",
                    )}
                  />
                  <span className="font-head flex-1">{t(`modes.${m}`)}</span>
                  <Tooltip content={t(`modeDesc.${m}`)}>
                    <Info size={16} className="text-muted-foreground shrink-0" />
                  </Tooltip>
                </div>
                <p className="text-sm text-muted-foreground ml-6">{t(`modeDesc.${m}`)}</p>
              </button>
            ))}
          </div>
        </Card.Content>
      </Card>

      <Card className="w-full">
        <Card.Content className="flex flex-col gap-3">
          <SectionTitle>{t("category")}</SectionTitle>
          {isBomb ? (
            <div className="flex items-center gap-2 rounded border-2 border-border bg-accent/50 p-3 text-sm">
              <Shuffle size={18} className="shrink-0" />
              <span>{t("bombCategoryNote")}</span>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {CATEGORY_SLUGS.map((slug) => (
                <button
                  key={slug}
                  type="button"
                  className={cn(
                    "px-3 py-1.5 border-2 border-border rounded font-head text-sm transition-all shadow-xs",
                    "hover:translate-y-[1px] hover:shadow-none",
                    categorySlugs.includes(slug)
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "bg-card text-card-foreground",
                  )}
                  onClick={() => toggleCategory(slug)}
                >
                  {t(`categories.${slug}`)}
                </button>
              ))}
            </div>
          )}
        </Card.Content>
      </Card>

      {mode !== "bomb" && (
        <Card className="w-full">
          <Card.Content className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <SectionTitle>{t("roundTime")}</SectionTitle>
              <span className="font-mono font-bold">
                {roundTime} {tCommon("seconds")}
              </span>
            </div>
            <input
              type="range"
              min={30}
              max={180}
              step={10}
              value={roundTime}
              onChange={(e) => setRoundTime(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </Card.Content>
        </Card>
      )}

      {mode === "bomb" && (
        <Card className="w-full">
          <Card.Content className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <SectionTitle>{t("bombTime")}</SectionTitle>
              <span className="font-mono font-bold">
                {bombTime} {tCommon("seconds")}
              </span>
            </div>
            <input
              type="range"
              min={10}
              max={120}
              step={5}
              value={bombTime}
              onChange={(e) => setBombTime(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </Card.Content>
        </Card>
      )}

      {(mode === "normal" || mode === "bomb") && (
        <Card className="w-full">
          <Card.Content className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <SectionTitle>{t("targetScore")}</SectionTitle>
              <span className="font-mono font-bold">
                {targetScore} {tCommon("points")}
              </span>
            </div>
            <input
              type="range"
              min={mode === "bomb" ? 3 : 10}
              max={mode === "bomb" ? 20 : 100}
              step={mode === "bomb" ? 1 : 5}
              value={targetScore}
              onChange={(e) => setTargetScore(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </Card.Content>
        </Card>
      )}

      <Card className="w-full">
        <Card.Content className="flex flex-col gap-3">
          <SectionTitle>{t("passLimit")}</SectionTitle>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                className={cn(
                  "flex-1 py-2 border-2 border-border rounded font-mono font-bold transition-all shadow-xs",
                  "hover:translate-y-[1px] hover:shadow-none",
                  passLimit === n
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-card text-card-foreground",
                )}
                onClick={() => setPassLimit(n)}
              >
                {n}
              </button>
            ))}
          </div>
        </Card.Content>
      </Card>

      <Card className="w-full">
        <Card.Content className="flex flex-col gap-3">
          <SectionTitle>{t("lobbyType")}</SectionTitle>
          <div className="flex gap-2">
            <button
              type="button"
              className={cn(
                "flex-1 py-3 border-2 border-border rounded font-head transition-all shadow-xs",
                "hover:translate-y-[1px] hover:shadow-none",
                !isPublic
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-card text-card-foreground",
              )}
              onClick={() => setIsPublic(false)}
            >
              🔒 {t("private")}
            </button>
            <button
              type="button"
              className={cn(
                "flex-1 py-3 border-2 border-border rounded font-head transition-all shadow-xs",
                "hover:translate-y-[1px] hover:shadow-none",
                isPublic
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-card text-card-foreground",
              )}
              onClick={() => setIsPublic(true)}
            >
              🌐 {t("public")}
            </button>
          </div>
        </Card.Content>
      </Card>

      <Button
        variant="primary"
        size="lg"
        fullWidth
        icon={<Rocket size={20} />}
        onClick={handleCreate}
      >
        {t("createButton")}
      </Button>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-head text-xs uppercase tracking-wider text-muted-foreground">
      {children}
    </div>
  );
}
