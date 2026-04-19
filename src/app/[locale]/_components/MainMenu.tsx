"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, KeyRound, Plus, Globe, Lightbulb } from "lucide-react";
import { useTranslations } from "next-intl";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useRouter } from "@/lib/i18n/routing";
import styles from "./MainMenu.module.css";
import { toast } from "sonner";
import { getSupabaseBrowser } from "@/lib/supabase/client";

export function MainMenu() {
  const t = useTranslations("home");
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const username = usePlayerStore((s) => s.username);
  const avatarId = usePlayerStore((s) => s.avatarId);
  const setUsername = usePlayerStore((s) => s.setUsername);
  const cycleAvatar = usePlayerStore((s) => s.cycleAvatar);

  useEffect(() => setHydrated(true), []);

  const ensureUsername = () => {
    if (!username.trim()) {
      toast.error(t("usernameRequired"));
      return false;
    }
    return true;
  };

  return (
    <div className="page-container">
      <motion.header
        className={styles.header}
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="hero-title">{t("title")}</h1>
        <p className="hero-subtitle">{t("subtitle")}</p>
      </motion.header>

      <motion.section
        className={styles.identity}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className={styles.avatarRow}>
          <button
            className={styles.avatarArrow}
            onClick={() => cycleAvatar(-1)}
            aria-label={t("prevAvatar")}
          >
            <ChevronLeft size={24} />
          </button>
          <motion.div key={avatarId} initial={{ scale: 0.9 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 18, stiffness: 260 }}>
            <Avatar avatarId={avatarId} size="lg" ring />
          </motion.div>
          <button
            className={styles.avatarArrow}
            onClick={() => cycleAvatar(1)}
            aria-label={t("nextAvatar")}
          >
            <ChevronRight size={24} />
          </button>
        </div>

        <Input
          placeholder={t("usernamePlaceholder")}
          value={hydrated ? username : ""}
          onChange={(e) => setUsername(e.target.value)}
          maxLength={16}
        />
      </motion.section>

      <motion.section
        className="stack"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Button
          variant="primary"
          size="lg"
          fullWidth
          icon={<Plus size={20} />}
          onClick={() => {
            if (!ensureUsername()) return;
            router.push("/create");
          }}
        >
          {t("createLobby")}
        </Button>
        <Button
          variant="ghost"
          size="lg"
          fullWidth
          icon={<KeyRound size={20} />}
          onClick={() => {
            if (!ensureUsername()) return;
            router.push("/join");
          }}
        >
          {t("joinByCode")}
        </Button>
        <Button
          variant="ghost"
          size="lg"
          fullWidth
          icon={<Globe size={20} />}
          onClick={() => router.push("/browse")}
        >
          {t("lobbyList")}
        </Button>
        <Button
          variant="subtle"
          size="md"
          icon={<Lightbulb size={16} />}
          onClick={() => setSuggestOpen(true)}
        >
          {t("suggestWord")}
        </Button>
      </motion.section>

      <div className={styles.footer}>
        <span>{t("version")}</span>
      </div>

      <SuggestWordModal open={suggestOpen} onClose={() => setSuggestOpen(false)} />
    </div>
  );
}

function SuggestWordModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTranslations("home");
  const [word, setWord] = useState("");
  const [forbidden, setForbidden] = useState(["", "", "", "", ""]);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!word.trim() || forbidden.filter((f) => f.trim()).length < 3) {
      toast.error("Kelime ve en az 3 yasak kelime gerekli");
      return;
    }
    setSubmitting(true);
    try {
      const client = getSupabaseBrowser();
      if (client) {
        await client.from("word_suggestions").insert({
          word: word.trim(),
          forbidden_words: forbidden.map((f) => f.trim()).filter(Boolean),
          category_slug: "genel",
          language: "tr",
        });
      }
      toast.success("Teşekkürler! Önerin incelenecek.");
      onClose();
      setWord("");
      setForbidden(["", "", "", "", ""]);
    } catch {
      toast.error("Gönderilemedi, daha sonra dene.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={t("suggestWord")}>
      <Input
        label="Kelime"
        placeholder="Ör. Kahve"
        value={word}
        onChange={(e) => setWord(e.target.value)}
      />
      <div className="stack-sm">
        <span className={styles.forbiddenLabel}>Yasak Kelimeler</span>
        {forbidden.map((f, i) => (
          <Input
            key={i}
            placeholder={`Yasak ${i + 1}`}
            value={f}
            onChange={(e) => {
              const next = [...forbidden];
              next[i] = e.target.value;
              setForbidden(next);
            }}
          />
        ))}
      </div>
      <Button variant="primary" fullWidth loading={submitting} onClick={submit}>
        Gönder
      </Button>
    </Modal>
  );
}
