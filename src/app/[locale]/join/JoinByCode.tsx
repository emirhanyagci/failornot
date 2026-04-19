"use client";

import { useState } from "react";
import { ArrowLeft, KeyRound } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/retroui/Card";
import { useRouter } from "@/lib/i18n/routing";

export function JoinByCode() {
  const t = useTranslations("join");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [code, setCode] = useState("");

  const join = () => {
    const clean = code.trim().toUpperCase();
    if (!clean || clean.length < 3) return;
    router.push(`/${clean}` as "/");
  };

  return (
    <div className="w-full max-w-md flex flex-col gap-4">
      <div>
        <Button variant="subtle" icon={<ArrowLeft size={18} />} onClick={() => router.back()}>
          {tCommon("back")}
        </Button>
      </div>
      <h1 className="font-head text-3xl uppercase">{t("title")}</h1>
      <Card className="w-full">
        <Card.Content>
          <Input
            mono
            placeholder={t("codePlaceholder")}
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            maxLength={8}
            onKeyDown={(e) => e.key === "Enter" && join()}
            autoFocus
          />
        </Card.Content>
      </Card>
      <Button variant="primary" size="lg" fullWidth icon={<KeyRound size={20} />} onClick={join}>
        {t("joinButton")}
      </Button>
    </div>
  );
}
