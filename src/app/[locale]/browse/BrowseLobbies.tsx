"use client";

import { ArrowLeft, Globe } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/retroui/Card";
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
    <div className="w-full max-w-md flex flex-col gap-4">
      <div>
        <Button variant="subtle" icon={<ArrowLeft size={18} />} onClick={() => router.back()}>
          {tCommon("back")}
        </Button>
      </div>
      <h1 className="font-head text-3xl uppercase flex items-center gap-2">
        <Globe size={28} />
        {title}
      </h1>
      <Card className="w-full">
        <Card.Content className="text-center flex flex-col gap-3">
          <p className="text-lg font-head">{empty}</p>
          <p className="text-sm text-muted-foreground">{note}</p>
        </Card.Content>
      </Card>
    </div>
  );
}
