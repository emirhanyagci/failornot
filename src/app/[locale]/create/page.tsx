import { setRequestLocale } from "next-intl/server";
import { CreateLobbyForm } from "./CreateLobbyForm";

export default async function CreatePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <CreateLobbyForm />;
}
