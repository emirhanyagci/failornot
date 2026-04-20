import { setRequestLocale } from "next-intl/server";
import { InviteJoin } from "./InviteJoin";

export default async function InviteJoinPage({
  params,
}: {
  params: Promise<{ locale: string; lobbyId: string }>;
}) {
  const { locale, lobbyId } = await params;
  setRequestLocale(locale);
  return <InviteJoin lobbyId={lobbyId.toUpperCase()} />;
}
