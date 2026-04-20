"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Home, LogIn } from "lucide-react";
import { useTranslations } from "next-intl";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/retroui/Card";
import { useRouter } from "@/lib/i18n/routing";
import { usePlayerStore } from "@/stores/usePlayerStore";

interface InviteJoinProps {
  lobbyId: string;
}

export function InviteJoin({ lobbyId }: InviteJoinProps) {
  const t = useTranslations("invite");
  const tHome = useTranslations("home");
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const username = usePlayerStore((s) => s.username);
  const avatarId = usePlayerStore((s) => s.avatarId);
  const setUsername = usePlayerStore((s) => s.setUsername);
  const cycleAvatar = usePlayerStore((s) => s.cycleAvatar);

  useEffect(() => setHydrated(true), []);

  // Once hydrated and we already know the player's username, jump straight into
  // the lobby room. RoomClient owns the actual connection + join logic and
  // surfaces lobby-full / game-in-progress errors.
  useEffect(() => {
    if (!hydrated) return;
    if (!username.trim()) return;
    router.replace(`/${lobbyId}` as "/");
  }, [hydrated, username, lobbyId, router]);

  if (!hydrated) {
    return <JoiningState label={t("joining")} code={t("code", { code: lobbyId })} />;
  }

  if (username.trim()) {
    return <JoiningState label={t("joining")} code={t("code", { code: lobbyId })} />;
  }

  const submit = () => {
    const clean = username.trim();
    if (!clean) return;
    router.replace(`/${lobbyId}` as "/");
  };

  return (
    <div className="w-full max-w-md flex flex-col gap-4">
      <h1 className="font-head text-3xl uppercase">{t("enterUsernameTitle")}</h1>
      <p className="text-sm text-muted-foreground">
        {t("enterUsernameNote")} {t("code", { code: lobbyId })}
      </p>

      <Card className="w-full">
        <Card.Content className="flex flex-col gap-4 items-stretch">
          <div className="flex items-center justify-center gap-4">
            <button
              type="button"
              className="border-2 border-border bg-card p-2 rounded shadow-xs hover:bg-accent transition-colors"
              onClick={() => cycleAvatar(-1)}
              aria-label={tHome("prevAvatar")}
            >
              <ChevronLeft size={24} />
            </button>
            <Avatar avatarId={avatarId} size="lg" ring />
            <button
              type="button"
              className="border-2 border-border bg-card p-2 rounded shadow-xs hover:bg-accent transition-colors"
              onClick={() => cycleAvatar(1)}
              aria-label={tHome("nextAvatar")}
            >
              <ChevronRight size={24} />
            </button>
          </div>

          <Input
            placeholder={tHome("usernamePlaceholder")}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            maxLength={16}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            autoFocus
          />
        </Card.Content>
      </Card>

      <Button
        variant="primary"
        size="lg"
        fullWidth
        icon={<LogIn size={20} />}
        onClick={submit}
        disabled={!username.trim()}
      >
        {t("joinLobby")}
      </Button>

      <Button
        variant="subtle"
        size="sm"
        icon={<Home size={16} />}
        onClick={() => router.push("/")}
      >
        {t("backHome")}
      </Button>
    </div>
  );
}

function JoiningState({ label, code }: { label: string; code: string }) {
  return (
    <div className="w-full max-w-md flex flex-col gap-3 items-center justify-center min-h-[60vh]">
      <div className="font-head text-xl uppercase">{label}</div>
      <div className="text-sm text-muted-foreground font-mono">{code}</div>
    </div>
  );
}
