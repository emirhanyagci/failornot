import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { Inter, Outfit, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { locales, type Locale } from "@/lib/i18n/config";
import { Background } from "@/components/layout/Background";
import "@/app/globals.css";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-display", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-body", display: "swap" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  title: "Faul or Not",
  description: "Türkçe çevrimiçi Tabu oyunu. Arkadaşlarınla lobi oluştur, kelimeleri anlat, kazan!",
  openGraph: {
    title: "Faul or Not",
    description: "Arkadaşlarınla Türkçe Tabu oyunu!",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!(locales as readonly string[]).includes(locale)) notFound();
  setRequestLocale(locale as Locale);
  const messages = await getMessages();

  return (
    <html lang={locale} className={`${outfit.variable} ${inter.variable} ${jetbrains.variable}`}>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Background />
          <main className="app-shell">{children}</main>
          <Toaster
            position="top-center"
            theme="dark"
            toastOptions={{
              style: {
                background: "var(--surface-elevated)",
                border: "1px solid var(--surface-glass-border)",
                color: "var(--text-primary)",
                fontFamily: "var(--font-body)",
              },
            }}
          />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
