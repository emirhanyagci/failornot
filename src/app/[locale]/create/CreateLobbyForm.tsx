"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Info, Rocket } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Tooltip } from "@/components/ui/Tooltip";
import { useRouter } from "@/lib/i18n/routing";
import { generateLobbyCode } from "@/lib/utils";
import type { GameMode, LobbySettings } from "@/types/game";
import styles from "./CreateLobbyForm.module.css";

const CATEGORY_SLUGS = ["genel", "karisik", "oyun", "spor", "bilim", "tarih"] as const;
const MODES: GameMode[] = ["normal", "sudden_death", "bomb"];

export function CreateLobbyForm() {
  const t = useTranslations("create");
  const tCommon = useTranslations("common");
  const router = useRouter();

  const [mode, setMode] = useState<GameMode>("normal");
  const [categorySlugs, setCategorySlugs] = useState<string[]>(["genel"]);
  const [roundTime, setRoundTime] = useState(60);
  const [targetScore, setTargetScore] = useState(30);
  const [passLimit, setPassLimit] = useState(3);
  const [isPublic, setIsPublic] = useState(false);

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
      categorySlugs,
      roundTime,
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
    <motion.div
      className="page-container"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className={styles.topBar}>
        <Button variant="subtle" icon={<ArrowLeft size={18} />} onClick={() => router.back()}>
          {tCommon("back")}
        </Button>
        <h2>{t("title")}</h2>
        <div style={{ width: 48 }} />
      </div>

      <section className="glass-card">
        <div className="section-title">{t("gameMode")}</div>
        <div className={styles.modeList}>
          {MODES.map((m) => (
            <button
              key={m}
              className={`${styles.modeOption} ${mode === m ? styles.modeActive : ""}`}
              onClick={() => setMode(m)}
            >
              <div className={styles.modeHeader}>
                <span className={styles.radio} data-active={mode === m} />
                <span className={styles.modeName}>{t(`modes.${m}`)}</span>
                <Tooltip content={t(`modeDesc.${m}`)}>
                  <Info size={16} className={styles.infoIcon} />
                </Tooltip>
              </div>
              <p className={styles.modeDesc}>{t(`modeDesc.${m}`)}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="glass-card">
        <div className="section-title">{t("category")}</div>
        <div className={styles.chipGroup}>
          {CATEGORY_SLUGS.map((slug) => (
            <button
              key={slug}
              className={`${styles.chip} ${categorySlugs.includes(slug) ? styles.chipActive : ""}`}
              onClick={() => toggleCategory(slug)}
            >
              {t(`categories.${slug}`)}
            </button>
          ))}
        </div>
      </section>

      {mode !== "bomb" && (
        <section className="glass-card">
          <div className={styles.sliderBlock}>
            <div className="row-between">
              <span className="section-title" style={{ margin: 0 }}>
                {t("roundTime")}
              </span>
              <span className={styles.sliderValue}>
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
              className={styles.slider}
            />
          </div>
        </section>
      )}

      {mode === "normal" && (
        <section className="glass-card">
          <div className={styles.sliderBlock}>
            <div className="row-between">
              <span className="section-title" style={{ margin: 0 }}>
                {t("targetScore")}
              </span>
              <span className={styles.sliderValue}>
                {targetScore} {tCommon("points")}
              </span>
            </div>
            <input
              type="range"
              min={10}
              max={100}
              step={5}
              value={targetScore}
              onChange={(e) => setTargetScore(Number(e.target.value))}
              className={styles.slider}
            />
          </div>
        </section>
      )}

      <section className="glass-card">
        <div className="section-title">{t("passLimit")}</div>
        <div className={styles.segmented}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              className={`${styles.segment} ${passLimit === n ? styles.segmentActive : ""}`}
              onClick={() => setPassLimit(n)}
            >
              {n}
            </button>
          ))}
        </div>
      </section>

      <section className="glass-card">
        <div className="section-title">{t("lobbyType")}</div>
        <div className={styles.toggleRow}>
          <button
            className={`${styles.toggleOption} ${!isPublic ? styles.toggleActive : ""}`}
            onClick={() => setIsPublic(false)}
          >
            🔒 {t("private")}
          </button>
          <button
            className={`${styles.toggleOption} ${isPublic ? styles.toggleActive : ""}`}
            onClick={() => setIsPublic(true)}
          >
            🌐 {t("public")}
          </button>
        </div>
      </section>

      <Button
        variant="primary"
        size="lg"
        fullWidth
        icon={<Rocket size={20} />}
        onClick={handleCreate}
      >
        {t("createButton")}
      </Button>
    </motion.div>
  );
}
