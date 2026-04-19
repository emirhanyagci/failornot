"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FileJson, LogOut, PenLine, Plus, Search, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Card } from "@/components/retroui/Card";
import { cn } from "@/lib/utils";
import { capitalizeWord } from "@/lib/admin/words";

interface Category {
  id: string;
  slug: string;
  name_tr: string;
  name_en: string | null;
  icon: string | null;
  sort_order: number;
}

type Tab = "single" | "bulk" | "manage";

const EMPTY_FORBIDDEN = ["", "", "", "", ""] as const;

export function AdminPanel() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("single");
  const [categories, setCategories] = useState<Category[]>([]);
  const [catsLoading, setCatsLoading] = useState(true);
  const [catsError, setCatsError] = useState<string | null>(null);
  const [defaultCategory, setDefaultCategory] = useState<string>("");

  const loadCategories = useCallback(async () => {
    setCatsLoading(true);
    setCatsError(null);
    try {
      const res = await fetch("/api/admin/categories", { cache: "no-store" });
      const data = (await res.json()) as {
        ok: boolean;
        categories?: Category[];
        error?: string;
      };
      if (!res.ok || !data.ok) {
        setCatsError(
          data.error === "SUPABASE_NOT_CONFIGURED"
            ? "Supabase yapılandırılmamış. `.env.local` içinde SUPABASE_SERVICE_ROLE_KEY tanımla."
            : data.error || "Kategoriler yüklenemedi.",
        );
        return;
      }
      const cats = data.categories ?? [];
      setCategories(cats);
      if (cats.length > 0 && !defaultCategory) {
        setDefaultCategory(cats[0].slug);
      }
    } catch {
      setCatsError("Sunucuya ulaşılamadı.");
    } finally {
      setCatsLoading(false);
    }
  }, [defaultCategory]);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.refresh();
  }

  return (
    <div className="w-full max-w-5xl py-4 flex flex-col gap-5">
      <header className="flex items-end justify-between gap-3 flex-wrap">
        <div className="flex flex-col gap-1">
          <h1 className="font-head text-2xl uppercase">Kelime Yönetimi</h1>
          <p className="text-muted-foreground text-sm">
            Oyunda görünecek kelimeleri buradan yönet.
          </p>
        </div>
        <Button size="sm" icon={<LogOut size={14} />} onClick={logout}>
          Çıkış
        </Button>
      </header>

      {catsError && (
        <div className="px-3 py-2 border-2 border-destructive bg-destructive/10 text-destructive font-head rounded text-sm">
          <strong>Hata:</strong> {catsError}
        </div>
      )}

      <nav className="inline-flex gap-1 p-1 border-2 border-border bg-card rounded w-fit">
        <TabButton active={tab === "single"} onClick={() => setTab("single")}>
          <PenLine size={16} /> Tek Kelime
        </TabButton>
        <TabButton active={tab === "bulk"} onClick={() => setTab("bulk")}>
          <FileJson size={16} /> JSON Toplu Yükleme
        </TabButton>
        <TabButton active={tab === "manage"} onClick={() => setTab("manage")}>
          <Search size={16} /> Tum Kelimeler
        </TabButton>
      </nav>

      {tab === "single" ? (
        <SingleWordForm
          categories={categories}
          categoriesLoading={catsLoading}
          defaultCategory={defaultCategory}
          onCategoryChange={setDefaultCategory}
        />
      ) : tab === "bulk" ? (
        <BulkJsonForm
          categories={categories}
          categoriesLoading={catsLoading}
          defaultCategory={defaultCategory}
          onCategoryChange={setDefaultCategory}
        />
      ) : (
        <WordsManager categories={categories} />
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-2 rounded font-head text-sm transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
      )}
    >
      {children}
    </button>
  );
}

/* ---------------- Single ---------------- */

function SingleWordForm({
  categories,
  categoriesLoading,
  defaultCategory,
  onCategoryChange,
}: {
  categories: Category[];
  categoriesLoading: boolean;
  defaultCategory: string;
  onCategoryChange: (slug: string) => void;
}) {
  const [word, setWord] = useState("");
  const [forbidden, setForbidden] = useState<string[]>([...EMPTY_FORBIDDEN]);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  const canSubmit =
    !submitting &&
    word.trim().length > 0 &&
    forbidden.every((f) => f.trim().length > 0) &&
    !!defaultCategory;

  function setForbiddenAt(i: number, v: string) {
    setForbidden((prev) => {
      const next = [...prev];
      next[i] = v;
      return next;
    });
  }

  async function onSubmit() {
    setFeedback(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/words", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          word: word.trim(),
          forbidden: forbidden.map((f) => f.trim()),
          categorySlug: defaultCategory,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        errors?: Array<{ index: number; reason: string }>;
      };
      if (!res.ok || !data.ok) {
        const reason = data.errors?.[0]?.reason ?? data.error ?? "Bilinmeyen hata";
        setFeedback({ ok: false, msg: friendlyError(reason) });
        return;
      }
      setFeedback({ ok: true, msg: `"${capitalizeWord(word)}" eklendi.` });
      setWord("");
      setForbidden([...EMPTY_FORBIDDEN]);
    } catch {
      setFeedback({ ok: false, msg: "Sunucuya ulaşılamadı." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="w-full">
      <Card.Content className="flex flex-col gap-4">
        <CategorySelect
          categories={categories}
          loading={categoriesLoading}
          value={defaultCategory}
          onChange={onCategoryChange}
        />

        <Input
          label="Kelime"
          value={word}
          onChange={(e) => setWord(e.target.value)}
          placeholder="Örn: Güneş"
          maxLength={64}
        />

        <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-2">
          {forbidden.map((v, i) => (
            <Input
              key={i}
              label={`Yasaklı ${i + 1}`}
              value={v}
              onChange={(e) => setForbiddenAt(i, e.target.value)}
              maxLength={32}
              placeholder={["ışık", "sıcak", "yıldız", "gündüz", "sarı"][i]}
            />
          ))}
        </div>

        {feedback && <FeedbackBox feedback={feedback}>{feedback.msg}</FeedbackBox>}

        <div className="flex justify-end gap-2">
          <Button
            variant="primary"
            icon={<Plus size={16} />}
            onClick={onSubmit}
            disabled={!canSubmit}
            loading={submitting}
          >
            Kelimeyi Ekle
          </Button>
        </div>
      </Card.Content>
    </Card>
  );
}

/* ---------------- Bulk ---------------- */

const SAMPLE_JSON = `[
  {
    "word": "Güneş",
    "forbidden": ["ışık", "sıcak", "yıldız", "gündüz", "sarı"]
  },
  {
    "word": "Basketbol",
    "forbidden": ["pota", "top", "sayı", "smaç", "saha"],
    "categorySlug": "spor"
  }
]`;

function BulkJsonForm({
  categories,
  categoriesLoading,
  defaultCategory,
  onCategoryChange,
}: {
  categories: Category[];
  categoriesLoading: boolean;
  defaultCategory: string;
  onCategoryChange: (slug: string) => void;
}) {
  const [raw, setRaw] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<
    | null
    | {
        ok: boolean;
        received?: number;
        upserted?: number;
        inserted?: number;
        skipped?: number;
        skippedWords?: string[];
        errors?: Array<{ index: number; reason: string }>;
        unknownCategories?: string[];
        msg?: string;
      }
  >(null);

  const parsed = useMemo(() => {
    if (!raw.trim()) return { ok: false, count: 0, error: null as string | null };
    try {
      const value = JSON.parse(raw);
      if (Array.isArray(value)) return { ok: true, count: value.length, error: null };
      if (value && Array.isArray(value.words)) {
        return { ok: true, count: value.words.length as number, error: null };
      }
      return { ok: false, count: 0, error: "JSON bir dizi ya da { words: [...] } olmalı." };
    } catch (e) {
      return { ok: false, count: 0, error: (e as Error).message };
    }
  }, [raw]);

  function onFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const content = String(reader.result ?? "");
      setRaw(content);
    };
    reader.readAsText(file);
  }

  async function onSubmit() {
    setFeedback(null);
    setSubmitting(true);
    try {
      let body: unknown;
      try {
        body = JSON.parse(raw);
      } catch {
        setFeedback({ ok: false, msg: "Geçersiz JSON." });
        setSubmitting(false);
        return;
      }
      const payload = Array.isArray(body)
        ? { words: body, defaultCategorySlug: defaultCategory }
        : { ...(body as object), defaultCategorySlug: defaultCategory };

      const res = await fetch("/api/admin/words/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        received?: number;
        upserted?: number;
        inserted?: number;
        skipped?: number;
        skippedWords?: string[];
        error?: string;
        errors?: Array<{ index: number; reason: string }>;
        unknownCategories?: string[];
      };
      if (!res.ok || !data.ok) {
        setFeedback({
          ok: false,
          msg: data.error ? friendlyError(data.error) : "İçe aktarma başarısız.",
          errors: data.errors,
          unknownCategories: data.unknownCategories,
        });
        return;
      }
      setFeedback({
        ok: true,
        received: data.received,
        upserted: data.upserted,
        inserted: data.inserted,
        skipped: data.skipped,
        skippedWords: data.skippedWords,
        errors: data.errors,
        unknownCategories: data.unknownCategories,
      });
      if ((data.errors?.length ?? 0) === 0 && (data.skipped ?? 0) === 0) setRaw("");
    } catch {
      setFeedback({ ok: false, msg: "Sunucuya ulaşılamadı." });
    } finally {
      setSubmitting(false);
    }
  }

  const disabled = submitting || !parsed.ok || parsed.count === 0 || !defaultCategory;

  return (
    <Card className="w-full">
      <Card.Content className="flex flex-col gap-4">
        <CategorySelect
          categories={categories}
          loading={categoriesLoading}
          value={defaultCategory}
          onChange={onCategoryChange}
          label="Varsayılan kategori (JSON içinde `categorySlug` yoksa buraya düşer)"
        />

        <div className="flex gap-2 items-center flex-wrap">
          <label className="inline-flex items-center gap-1.5 px-3 py-2 border-2 border-border bg-card rounded shadow-xs hover:bg-accent transition-colors text-sm cursor-pointer">
            <Upload size={14} />
            <span>.json dosyası seç</span>
            <input
              type="file"
              className="hidden"
              accept="application/json,.json"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onFile(f);
              }}
            />
          </label>
          <Button
            variant="ghost"
            size="sm"
            icon={<FileJson size={14} />}
            onClick={() => setRaw(SAMPLE_JSON)}
            type="button"
          >
            Örnek JSON yükle
          </Button>
          {raw && (
            <Button
              variant="ghost"
              size="sm"
              icon={<Trash2 size={14} />}
              onClick={() => setRaw("")}
              type="button"
            >
              Temizle
            </Button>
          )}
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="font-head text-xs uppercase tracking-wider text-muted-foreground">
            JSON içerik
          </span>
          <textarea
            className="w-full min-h-[280px] p-3 border-2 border-border bg-card text-card-foreground rounded font-mono text-sm leading-relaxed resize-y shadow-xs focus:outline-hidden focus:shadow-none"
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder={SAMPLE_JSON}
            rows={16}
            spellCheck={false}
          />
        </label>

        <div className="text-sm">
          {parsed.ok ? (
            <span className="text-success font-head">
              JSON geçerli · {parsed.count} kayıt tespit edildi
            </span>
          ) : parsed.error ? (
            <span className="text-destructive font-head">Parse hatası: {parsed.error}</span>
          ) : (
            <span className="text-muted-foreground">JSON bekleniyor…</span>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="primary"
            icon={<Upload size={16} />}
            onClick={onSubmit}
            disabled={disabled}
            loading={submitting}
          >
            {parsed.count > 0 ? `${parsed.count} kelimeyi yükle` : "Yükle"}
          </Button>
        </div>

        {feedback && (
          <FeedbackBox feedback={feedback}>
            {feedback.ok ? (
              <>
                <strong>Başarılı.</strong> {feedback.inserted ?? feedback.upserted}/
                {feedback.received} kayıt eklendi.
                {(feedback.skipped ?? 0) > 0 && (
                  <div className="mt-1 text-sm">
                    Zaten mevcut olduğu için atlanan {feedback.skipped} kelime:
                    {feedback.skippedWords && feedback.skippedWords.length > 0 && (
                      <span className="text-muted-foreground">
                        {" "}
                        {feedback
                          .skippedWords!.slice(0, 20)
                          .map((w) => capitalizeWord(w))
                          .join(", ")}
                        {feedback.skippedWords!.length > 20 ? "…" : ""}
                      </span>
                    )}
                  </div>
                )}
                {(feedback.errors?.length ?? 0) > 0 && (
                  <div className="mt-1 text-sm">
                    <div>Atlanan {feedback.errors!.length} kayıt:</div>
                    <ul className="mt-1 ml-5 list-disc">
                      {feedback.errors!.slice(0, 20).map((e, i) => (
                        <li key={i}>
                          #{e.index + 1} — {friendlyError(e.reason)}
                        </li>
                      ))}
                      {feedback.errors!.length > 20 && <li>…</li>}
                    </ul>
                  </div>
                )}
                {(feedback.unknownCategories?.length ?? 0) > 0 && (
                  <div className="mt-1 text-sm">
                    Bilinmeyen kategori(ler): {feedback.unknownCategories!.join(", ")}
                  </div>
                )}
              </>
            ) : (
              <>
                <strong>Hata:</strong> {feedback.msg}
                {(feedback.errors?.length ?? 0) > 0 && (
                  <ul className="mt-1 ml-5 list-disc text-sm">
                    {feedback.errors!.slice(0, 20).map((e, i) => (
                      <li key={i}>
                        #{e.index + 1} — {friendlyError(e.reason)}
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </FeedbackBox>
        )}
      </Card.Content>
    </Card>
  );
}

/* ---------------- Manage ---------------- */

interface AdminWord {
  id: string;
  word: string;
  forbidden_words: string[];
  difficulty: number;
  language: string;
  is_active: boolean;
  category: { slug: string; name_tr: string; icon: string | null } | null;
}

function WordsManager({ categories }: { categories: Category[] }) {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [query, setQuery] = useState("");
  const [words, setWords] = useState<AdminWord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<AdminWord | null>(null);

  const limit = 20;
  const pageCount = Math.max(1, Math.ceil(total / limit));

  const loadWords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (selectedCategory) params.set("category", selectedCategory);
      if (query.trim()) params.set("q", query.trim());
      const res = await fetch(`/api/admin/words?${params.toString()}`, { cache: "no-store" });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        words?: AdminWord[];
        total?: number;
      };
      if (!res.ok || !data.ok) {
        setError(friendlyError(data.error ?? "LIST_FAILED"));
        return;
      }
      setWords(data.words ?? []);
      setTotal(data.total ?? 0);
    } catch {
      setError("Sunucuya ulasilamadi.");
    } finally {
      setLoading(false);
    }
  }, [page, query, selectedCategory]);

  useEffect(() => {
    void loadWords();
  }, [loadWords]);

  async function removeWord(id: string) {
    const ok = window.confirm("Bu kelimeyi silmek istediginize emin misiniz?");
    if (!ok) return;
    const res = await fetch(`/api/admin/words/${id}`, { method: "DELETE" });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
    if (!res.ok || !data.ok) {
      setError(friendlyError(data.error ?? "DELETE_FAILED"));
      return;
    }
    if (words.length === 1 && page > 1) setPage((p) => p - 1);
    else void loadWords();
  }

  return (
    <Card className="w-full">
      <Card.Content className="flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-[minmax(220px,320px)_minmax(260px,1fr)] gap-3 items-end">
          <CategorySelect
            categories={categories}
            loading={false}
            value={selectedCategory}
            onChange={(value) => {
              setSelectedCategory(value);
              setPage(1);
            }}
            allowEmpty
            emptyLabel="Tumu"
          />
          <Input
            label="Kelime ara"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Orn: Futbol"
          />
        </div>

        {error && (
          <div className="px-3 py-2 border-2 border-destructive bg-destructive/10 text-destructive font-head text-sm rounded">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-3">
          {loading ? (
            <div className="text-center py-6 border-2 border-dashed border-border rounded text-muted-foreground">
              Yukleniyor...
            </div>
          ) : words.length === 0 ? (
            <div className="text-center py-6 border-2 border-dashed border-border rounded text-muted-foreground">
              Filtreye uygun kelime bulunamadi.
            </div>
          ) : (
            words.map((item) => (
              <article
                key={item.id}
                className="border-2 border-border rounded p-3 bg-card flex flex-col gap-2"
              >
                <div className="flex justify-between items-start gap-2 flex-wrap">
                  <div>
                    <div className="font-head text-base">{capitalizeWord(item.word)}</div>
                    <div className="text-muted-foreground text-sm">
                      {item.category?.icon ? `${item.category.icon} ` : ""}
                      {item.category?.name_tr ?? "Kategori yok"} · Dil: {item.language} · Zorluk:{" "}
                      {item.difficulty} · {item.is_active ? "Aktif" : "Pasif"}
                    </div>
                  </div>
                  <div className="inline-flex gap-1.5">
                    <Button size="sm" variant="ghost" onClick={() => setEditing(item)}>
                      Duzenle
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => void removeWord(item.id)}>
                      Sil
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {item.forbidden_words.map((f) => (
                    <span
                      key={f}
                      className="border-2 border-border bg-accent text-accent-foreground rounded px-2 py-0.5 text-xs font-head"
                    >
                      {capitalizeWord(f)}
                    </span>
                  ))}
                </div>
              </article>
            ))
          )}
        </div>

        <div className="flex items-center justify-between gap-2 flex-col sm:flex-row text-muted-foreground text-sm">
          <Button
            size="sm"
            variant="ghost"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Onceki
          </Button>
          <span>
            Sayfa {page} / {pageCount} · Toplam {total}
          </span>
          <Button
            size="sm"
            variant="ghost"
            disabled={page >= pageCount || loading}
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
          >
            Sonraki
          </Button>
        </div>

        <EditWordModal
          open={!!editing}
          word={editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            void loadWords();
          }}
        />
      </Card.Content>
    </Card>
  );
}

function EditWordModal({
  open,
  word,
  categories,
  onClose,
  onSaved,
}: {
  open: boolean;
  word: AdminWord | null;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    word: "",
    forbidden: [...EMPTY_FORBIDDEN] as string[],
    categorySlug: "",
    difficulty: 1,
    language: "tr",
    isActive: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!word) return;
    setForm({
      word: capitalizeWord(word.word),
      forbidden: [
        capitalizeWord(word.forbidden_words[0] ?? ""),
        capitalizeWord(word.forbidden_words[1] ?? ""),
        capitalizeWord(word.forbidden_words[2] ?? ""),
        capitalizeWord(word.forbidden_words[3] ?? ""),
        capitalizeWord(word.forbidden_words[4] ?? ""),
      ],
      categorySlug: word.category?.slug ?? categories[0]?.slug ?? "",
      difficulty: word.difficulty,
      language: word.language,
      isActive: word.is_active,
    });
    setError(null);
  }, [categories, word]);

  function setForbiddenAt(i: number, v: string) {
    setForm((prev) => {
      const next = [...prev.forbidden];
      next[i] = v;
      return { ...prev, forbidden: next };
    });
  }

  async function save() {
    if (!word) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/words/${word.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          word: form.word.trim(),
          forbidden: form.forbidden.map((f) => f.trim()),
          categorySlug: form.categorySlug,
          difficulty: form.difficulty,
          language: form.language.trim(),
          is_active: form.isActive,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(friendlyError(data.error ?? "UPDATE_FAILED"));
        return;
      }
      onSaved();
    } catch {
      setError("Sunucuya ulasilamadi.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Kelimeyi Duzenle" wide>
      {word && (
        <div className="flex flex-col gap-4">
          <Input
            label="Kelime"
            value={form.word}
            onChange={(e) => setForm((prev) => ({ ...prev, word: e.target.value }))}
            maxLength={64}
          />
          <CategorySelect
            categories={categories}
            loading={false}
            value={form.categorySlug}
            onChange={(value) => setForm((prev) => ({ ...prev, categorySlug: value }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="font-head text-xs uppercase tracking-wider text-muted-foreground">
                Zorluk
              </span>
              <select
                className="px-3 py-2 border-2 border-border bg-card text-card-foreground rounded font-sans shadow-xs focus:outline-hidden focus:shadow-none"
                value={String(form.difficulty)}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, difficulty: Number(e.target.value) || 1 }))
                }
              >
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
              </select>
            </label>
            <Input
              label="Dil"
              value={form.language}
              onChange={(e) => setForm((prev) => ({ ...prev, language: e.target.value }))}
              maxLength={8}
            />
          </div>
          <label className="inline-flex items-center gap-2 font-head text-sm">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
              className="w-4 h-4 border-2 border-border accent-primary"
            />
            <span>Aktif</span>
          </label>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-2">
            {form.forbidden.map((v, i) => (
              <Input
                key={i}
                label={`Yasakli ${i + 1}`}
                value={v}
                onChange={(e) => setForbiddenAt(i, e.target.value)}
                maxLength={32}
              />
            ))}
          </div>
          {error && (
            <div className="px-3 py-2 border-2 border-destructive bg-destructive/10 text-destructive font-head text-sm rounded">
              {error}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose}>
              Vazgec
            </Button>
            <Button variant="primary" onClick={() => void save()} loading={submitting}>
              Kaydet
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

/* ---------------- Shared ---------------- */

function FeedbackBox({
  feedback,
  children,
}: {
  feedback: { ok: boolean };
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "px-3 py-2 border-2 rounded text-sm",
        feedback.ok
          ? "border-success bg-success/10 text-foreground"
          : "border-destructive bg-destructive/10 text-foreground",
      )}
    >
      {children}
    </div>
  );
}

function CategorySelect({
  categories,
  loading,
  value,
  onChange,
  label = "Kategori",
  allowEmpty = false,
  emptyLabel = "Tumu",
}: {
  categories: Category[];
  loading: boolean;
  value: string;
  onChange: (v: string) => void;
  label?: string;
  allowEmpty?: boolean;
  emptyLabel?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-head text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <select
        className="px-3 py-2 border-2 border-border bg-card text-card-foreground rounded font-sans shadow-xs focus:outline-hidden focus:shadow-none disabled:opacity-50"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading || categories.length === 0}
      >
        {loading && <option>Yükleniyor…</option>}
        {!loading && categories.length === 0 && <option>Kategori yok</option>}
        {!loading && allowEmpty && categories.length > 0 && (
          <option value="">{emptyLabel}</option>
        )}
        {!loading &&
          categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.icon ? `${c.icon} ` : ""}
              {c.name_tr}
            </option>
          ))}
      </select>
    </label>
  );
}

function friendlyError(code: string): string {
  switch (code) {
    case "UNAUTHORIZED":
      return "Oturum geçersiz. Yeniden giriş yap.";
    case "SUPABASE_NOT_CONFIGURED":
      return "Supabase yapılandırılmamış.";
    case "WORD_MISSING":
      return "Kelime alanı eksik.";
    case "WORD_LENGTH":
      return "Kelime 1–64 karakter olmalı.";
    case "FORBIDDEN_NOT_ARRAY":
      return "`forbidden` bir dizi olmalı.";
    case "FORBIDDEN_MUST_BE_5":
      return "Tam 5 yasak kelime gerekli.";
    case "FORBIDDEN_TOO_LONG":
      return "Yasak kelime çok uzun (max 32 karakter).";
    case "CATEGORY_MISSING":
      return "Kategori seçilmedi.";
    case "DUPLICATE_IN_BATCH":
      return "Aynı kelime toplu içerikte tekrar ediyor.";
    case "ALREADY_EXISTS":
      return "Bu kelime zaten mevcut, atlandı.";
    case "FORBIDDEN_DUPLICATE":
      return "Yasaklı kelimeler kendi içinde tekrar ediyor.";
    case "UNKNOWN_CATEGORY":
      return "Bilinmeyen kategori.";
    case "EXPECTED_ARRAY":
      return "JSON bir dizi veya { words: [...] } olmalı.";
    case "EMPTY_BATCH":
      return "İçerik boş.";
    case "TOO_MANY":
      return "Tek seferde en fazla 5000 kelime yükleyebilirsin.";
    case "VALIDATION_FAILED":
      return "Doğrulama hatası.";
    case "INVALID_JSON":
      return "Geçersiz JSON.";
    case "WORD_NOT_FOUND":
      return "Kelime bulunamadi.";
    case "DELETE_FAILED":
      return "Kelime silinemedi.";
    case "LIST_FAILED":
      return "Kelime listesi yuklenemedi.";
    case "UPDATE_FAILED":
      return "Kelime guncellenemedi.";
    default:
      return code;
  }
}
