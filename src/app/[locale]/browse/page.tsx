import { setRequestLocale, getTranslations } from "next-intl/server";
import { BrowseLobbies } from "./BrowseLobbies";

export default async function BrowsePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("browse");
  return <BrowseLobbies title={t("title")} empty={t("empty")} note={t("note")} />;
}
