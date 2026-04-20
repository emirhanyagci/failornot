"use client";

import { useLocale } from "next-intl";
import { useTransition } from "react";
import { usePathname, useRouter } from "@/lib/i18n/routing";
import { locales, type Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

const LABELS: Record<Locale, string> = {
  tr: "TR",
  en: "EN",
};

const FLAGS: Record<Locale, string> = {
  tr: "🇹🇷",
  en: "🇬🇧",
};

export function LanguageSwitcher({ className }: { className?: string }) {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (pathname !== "/") return null;

  const switchTo = (next: Locale) => {
    if (next === locale || isPending) return;
    startTransition(() => {
      router.replace(pathname, { locale: next });
    });
  };

  return (
    <div
      className={cn(
        "fixed top-3 right-3 z-50 flex items-center gap-1 rounded border-2 border-border bg-card p-1 shadow-xs",
        className,
      )}
      role="group"
      aria-label="Language"
    >
      {locales.map((l) => {
        const active = l === locale;
        return (
          <button
            key={l}
            type="button"
            onClick={() => switchTo(l)}
            disabled={active || isPending}
            aria-pressed={active}
            aria-label={`Switch language to ${LABELS[l]}`}
            className={cn(
              "inline-flex items-center gap-1 rounded px-2 py-1 font-head text-xs uppercase tracking-wider transition-colors",
              active
                ? "bg-primary text-primary-foreground cursor-default"
                : "hover:bg-accent hover:text-accent-foreground",
              isPending && "opacity-70 cursor-wait",
            )}
          >
            <span aria-hidden>{FLAGS[l]}</span>
            <span>{LABELS[l]}</span>
          </button>
        );
      })}
    </div>
  );
}
