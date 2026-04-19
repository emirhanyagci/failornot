import { setRequestLocale } from "next-intl/server";
import { MainMenu } from "./_components/MainMenu";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <MainMenu />;
}
