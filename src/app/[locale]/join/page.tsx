import { setRequestLocale } from "next-intl/server";
import { JoinByCode } from "./JoinByCode";

export default async function JoinPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <JoinByCode />;
}
