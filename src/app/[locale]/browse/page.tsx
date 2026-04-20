import { setRequestLocale } from "next-intl/server";
import { BrowseLobbies } from "./BrowseLobbies";

export default async function BrowsePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <BrowseLobbies />;
}
