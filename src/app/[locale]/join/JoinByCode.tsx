"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, KeyRound } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
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
    <motion.div
      className="page-container"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Button variant="subtle" icon={<ArrowLeft size={18} />} onClick={() => router.back()}>
        {tCommon("back")}
      </Button>
      <h1 className="hero-title" style={{ fontSize: "2rem" }}>
        {t("title")}
      </h1>
      <div className="glass-card">
        <Input
          mono
          placeholder={t("codePlaceholder")}
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          maxLength={8}
          onKeyDown={(e) => e.key === "Enter" && join()}
          autoFocus
        />
      </div>
      <Button variant="primary" size="lg" fullWidth icon={<KeyRound size={20} />} onClick={join}>
        {t("joinButton")}
      </Button>
    </motion.div>
  );
}
