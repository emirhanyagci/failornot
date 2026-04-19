"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, KeyRound, Plus, Globe, Lightbulb } from "lucide-react";
import { useTranslations } from "next-intl";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Card } from "@/components/retroui/Card";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useRouter } from "@/lib/i18n/routing";
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
    <div className="w-full max-w-md flex flex-col gap-6">
      <header className="flex flex-col items-center text-center gap-2 mt-8">
        <h1 className="font-head text-4xl sm:text-5xl uppercase">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </header>

      <Card className="w-full">
        <Card.Content className="flex flex-col gap-4 items-stretch">
          <div className="flex items-center justify-center gap-4">
            <button
              type="button"
              className="border-2 border-border bg-card p-2 rounded shadow-xs hover:bg-accent transition-colors"
              onClick={() => cycleAvatar(-1)}
              aria-label={t("prevAvatar")}
            >
              <ChevronLeft size={24} />
            </button>
            <Avatar avatarId={avatarId} size="lg" ring />
            <button
              type="button"
              className="border-2 border-border bg-card p-2 rounded shadow-xs hover:bg-accent transition-colors"
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
        </Card.Content>
      </Card>

      <section className="flex flex-col gap-3">
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
      </section>

      <div className="text-center text-muted-foreground text-xs mt-2">
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
      <div className="flex flex-col gap-3">
        <Input
          label="Kelime"
          placeholder="Ör. Kahve"
          value={word}
          onChange={(e) => setWord(e.target.value)}
        />
        <div className="flex flex-col gap-2">
          <span className="font-head text-xs uppercase tracking-wider text-muted-foreground">
            Yasak Kelimeler
          </span>
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
      </div>
    </Modal>
  );
}
