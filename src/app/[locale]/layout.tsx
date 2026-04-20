import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { Archivo_Black, Space_Grotesk } from "next/font/google";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { locales, type Locale } from "@/lib/i18n/config";
import { Background } from "@/components/layout/Background";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { Toaster } from "@/components/retroui/Sonner";
import "@/app/globals.css";

const archivoBlack = Archivo_Black({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-head",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

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
    <html lang={locale} className={`${archivoBlack.variable} ${spaceGrotesk.variable}`}>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Background />
          <LanguageSwitcher />
          <main className="min-h-screen flex flex-col items-center px-4 py-6 sm:py-8">
            {children}
          </main>
          <Toaster position="top-center" />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
