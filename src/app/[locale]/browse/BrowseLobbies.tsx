"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Globe } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { useRouter } from "@/lib/i18n/routing";

interface BrowseLobbiesProps {
  title: string;
  empty: string;
  note: string;
}

export function BrowseLobbies({ title, empty, note }: BrowseLobbiesProps) {
  const tCommon = useTranslations("common");
  const router = useRouter();

  return (
    <motion.div className="page-container" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <Button variant="subtle" icon={<ArrowLeft size={18} />} onClick={() => router.back()}>
        {tCommon("back")}
      </Button>
      <h1 className="hero-title" style={{ fontSize: "2rem" }}>
        <Globe size={28} style={{ verticalAlign: "middle", marginRight: 8 }} />
        {title}
      </h1>
      <div className="glass-card" style={{ textAlign: "center" }}>
        <p style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>{empty}</p>
        <p className="text-muted" style={{ fontSize: "0.9rem" }}>
          {note}
        </p>
      </div>
    </motion.div>
  );
}
