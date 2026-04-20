"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  Globe,
  KeyRound,
  Lock,
  LogIn,
  RefreshCw,
  Users,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/retroui/Card";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { useRouter } from "@/lib/i18n/routing";
import { cn } from "@/lib/utils";
import type { GameMode } from "@/types/game";

interface LobbyListItem {
  id: string;
  code: string;
  isPublic: boolean;
  hasPassword: boolean;
  mode: GameMode;
  categorySlugs: string[];
  playerCount: number;
  maxPlayers: number;
  hostName: string;
  updatedAt: number;
}

type FetchState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ok"; lobbies: LobbyListItem[] }
  | { status: "error" };

export function BrowseLobbies() {
  const t = useTranslations("browse");
  const tCommon = useTranslations("common");
  const tCreate = useTranslations("create");
  const router = useRouter();

  const [state, setState] = useState<FetchState>({ status: "idle" });
  const [privateTarget, setPrivateTarget] = useState<LobbyListItem | null>(null);
  const [codeInput, setCodeInput] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);

  const fetchLobbies = useCallback(
    async (opts: { showToast?: boolean } = {}) => {
      setState({ status: "loading" });
      try {
        const res = await fetch("/api/lobbies", {
          method: "GET",
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as { lobbies?: LobbyListItem[] };
        setState({ status: "ok", lobbies: json.lobbies ?? [] });
        if (opts.showToast) {
          toast.success(tCommon("refresh"));
        }
      } catch {
        setState({ status: "error" });
      }
    },
    [tCommon],
  );

  useEffect(() => {
    void fetchLobbies();
  }, [fetchLobbies]);

  const handleJoinPublic = (lobby: LobbyListItem) => {
    if (!lobby.code) return;
    router.push(`/${lobby.code}` as "/");
  };

  const openPrivateModal = (lobby: LobbyListItem) => {
    setPrivateTarget(lobby);
    setCodeInput("");
    setCodeError(null);
  };

  const submitPrivateCode = () => {
    const clean = codeInput.trim().toUpperCase();
    if (clean.length < 3) {
      setCodeError(t("invalidCode"));
      return;
    }
    setPrivateTarget(null);
    router.push(`/${clean}` as "/");
  };

  const lobbies = state.status === "ok" ? state.lobbies : [];
  const isLoading = state.status === "loading";

  return (
    <div className="w-full max-w-md flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <Button variant="subtle" icon={<ArrowLeft size={18} />} onClick={() => router.back()}>
          {tCommon("back")}
        </Button>
        <Button
          variant="subtle"
          icon={<RefreshCw size={16} className={cn(isLoading && "animate-spin")} />}
          onClick={() => void fetchLobbies({ showToast: true })}
          disabled={isLoading}
          aria-label={tCommon("refresh")}
        >
          {tCommon("refresh")}
        </Button>
      </div>

      <h1 className="font-head text-3xl uppercase flex items-center gap-2">
        <Globe size={28} />
        {t("title")}
      </h1>

      {state.status === "loading" && (
        <Card className="w-full">
          <Card.Content className="text-center text-muted-foreground">
            {t("loading")}
          </Card.Content>
        </Card>
      )}

      {state.status === "error" && (
        <Card className="w-full">
          <Card.Content className="text-center flex flex-col gap-3">
            <p className="font-head">{t("loadError")}</p>
            <Button
              variant="primary"
              icon={<RefreshCw size={16} />}
              onClick={() => void fetchLobbies()}
            >
              {tCommon("retry")}
            </Button>
          </Card.Content>
        </Card>
      )}

      {state.status === "ok" && lobbies.length === 0 && (
        <Card className="w-full">
          <Card.Content className="text-center flex flex-col gap-2">
            <p className="text-lg font-head">{t("empty")}</p>
            <p className="text-sm text-muted-foreground">{t("note")}</p>
          </Card.Content>
        </Card>
      )}

      {state.status === "ok" && lobbies.length > 0 && (
        <div className="flex flex-col gap-3">
          {lobbies.map((lobby) => (
            <LobbyRow
              key={lobby.id}
              lobby={lobby}
              modeLabel={tCreate(`modes.${lobby.mode}`)}
              playersLabel={t("playersLabel", {
                count: lobby.playerCount,
                max: lobby.maxPlayers,
              })}
              hostLabel={t("hostLabel", { name: lobby.hostName || "—" })}
              publicLabel={t("public")}
              lockedLabel={t("locked")}
              joinLabel={t("joinButton")}
              hiddenCode={t("hiddenCode")}
              onJoinPublic={() => handleJoinPublic(lobby)}
              onJoinPrivate={() => openPrivateModal(lobby)}
            />
          ))}
        </div>
      )}

      <Modal
        open={!!privateTarget}
        onClose={() => setPrivateTarget(null)}
        title={t("privateJoinTitle")}
      >
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">{t("privateJoinNote")}</p>
          <Input
            mono
            placeholder="ABCD12"
            value={codeInput}
            onChange={(e) => {
              setCodeInput(e.target.value.toUpperCase());
              if (codeError) setCodeError(null);
            }}
            maxLength={8}
            onKeyDown={(e) => e.key === "Enter" && submitPrivateCode()}
            error={codeError ?? undefined}
            autoFocus
          />
          <Button
            variant="primary"
            size="lg"
            fullWidth
            icon={<KeyRound size={18} />}
            onClick={submitPrivateCode}
          >
            {t("joinButton")}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

interface LobbyRowProps {
  lobby: LobbyListItem;
  modeLabel: string;
  playersLabel: string;
  hostLabel: string;
  publicLabel: string;
  lockedLabel: string;
  joinLabel: string;
  hiddenCode: string;
  onJoinPublic: () => void;
  onJoinPrivate: () => void;
}

function LobbyRow({
  lobby,
  modeLabel,
  playersLabel,
  hostLabel,
  publicLabel,
  lockedLabel,
  joinLabel,
  hiddenCode,
  onJoinPublic,
  onJoinPrivate,
}: LobbyRowProps) {
  const isFull = lobby.playerCount >= lobby.maxPlayers;
  return (
    <Card className="w-full">
      <Card.Content className="flex items-center justify-between gap-3 p-3">
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono font-bold text-base tracking-wider">
              {lobby.isPublic ? lobby.code : hiddenCode}
            </span>
            <Badge tone={lobby.isPublic ? "public" : "private"}>
              {lobby.isPublic ? (
                <>
                  <Globe size={12} />
                  {publicLabel}
                </>
              ) : (
                <>
                  <Lock size={12} />
                  {lockedLabel}
                </>
              )}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground truncate">
            {modeLabel} • {hostLabel}
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Users size={12} />
            {playersLabel}
          </p>
        </div>
        <Button
          variant={lobby.isPublic ? "primary" : "accent"}
          size="sm"
          icon={lobby.isPublic ? <LogIn size={16} /> : <KeyRound size={16} />}
          onClick={lobby.isPublic ? onJoinPublic : onJoinPrivate}
          disabled={isFull}
        >
          {joinLabel}
        </Button>
      </Card.Content>
    </Card>
  );
}

function Badge({
  tone,
  children,
}: {
  tone: "public" | "private";
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-1.5 py-0.5 rounded border-2 border-border text-[10px] font-head uppercase tracking-wider",
        tone === "public"
          ? "bg-success text-success-foreground"
          : "bg-muted text-muted-foreground",
      )}
    >
      {children}
    </span>
  );
}
