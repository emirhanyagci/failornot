import { setRequestLocale } from "next-intl/server";
import { RoomClient } from "./RoomClient";

export default async function LobbyPage({
  params,
}: {
  params: Promise<{ locale: string; lobbyId: string }>;
}) {
  const { locale, lobbyId } = await params;
  setRequestLocale(locale);
  return <RoomClient lobbyId={lobbyId.toUpperCase()} />;
}
