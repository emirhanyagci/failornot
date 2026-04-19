import { setRequestLocale } from "next-intl/server";
import { isLoggedIn } from "@/lib/admin/auth";
import { AdminLogin } from "./AdminLogin";
import { AdminPanel } from "./AdminPanel";

export const dynamic = "force-dynamic";

export default async function AdminPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const loggedIn = await isLoggedIn();
  return loggedIn ? <AdminPanel /> : <AdminLogin />;
}
