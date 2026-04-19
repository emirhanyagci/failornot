"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FileJson, LogOut, PenLine, Plus, Search, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { cls } from "@/lib/utils";
import styles from "./admin.module.css";

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
    <div className={styles.panelWrap}>
      <header className={styles.panelHeader}>
        <div>
          <h1 className={styles.title}>Kelime Yönetimi</h1>
          <p className={styles.subtitle}>Oyunda görünecek kelimeleri buradan yönet.</p>
        </div>
        <Button variant="ghost" size="sm" icon={<LogOut size={14} />} onClick={logout}>
          Çıkış
        </Button>
      </header>

      {catsError && (
        <div className={styles.errorBanner}>
          <strong>Hata:</strong> {catsError}
        </div>
      )}

      <nav className={styles.tabs}>
        <button
          className={cls(styles.tab, tab === "single" && styles.tabActive)}
          onClick={() => setTab("single")}
          type="button"
        >
          <PenLine size={16} /> Tek Kelime
        </button>
        <button
          className={cls(styles.tab, tab === "bulk" && styles.tabActive)}
          onClick={() => setTab("bulk")}
          type="button"
        >
          <FileJson size={16} /> JSON Toplu Yükleme
        </button>
        <button
          className={cls(styles.tab, tab === "manage" && styles.tabActive)}
          onClick={() => setTab("manage")}
          type="button"
        >
          <Search size={16} /> Tum Kelimeler
        </button>
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
        <WordsManager
          categories={categories}
        />
      )}
    </div>
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
      setFeedback({ ok: true, msg: `"${word.trim()}" eklendi.` });
      setWord("");
      setForbidden([...EMPTY_FORBIDDEN]);
    } catch {
      setFeedback({ ok: false, msg: "Sunucuya ulaşılamadı." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className={styles.card}>
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

      <div className={styles.forbiddenGrid}>
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

      {feedback && (
        <div className={cls(styles.feedback, feedback.ok ? styles.ok : styles.err)}>
          {feedback.msg}
        </div>
      )}

      <div className={styles.actions}>
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
    </section>
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
        errors?: Array<{ index: number; reason: string }>;
        unknownCategories?: string[];
        msg?: string;
      }
  >(null);

  const parsed = useMemo(() => {
    if (!raw.trim()) return { ok: false, count: 0, error: null };
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
      const payload =
        Array.isArray(body)
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
        errors: data.errors,
        unknownCategories: data.unknownCategories,
      });
      if ((data.errors?.length ?? 0) === 0) setRaw("");
    } catch {
      setFeedback({ ok: false, msg: "Sunucuya ulaşılamadı." });
    } finally {
      setSubmitting(false);
    }
  }

  const disabled = submitting || !parsed.ok || parsed.count === 0 || !defaultCategory;

  return (
    <section className={styles.card}>
      <CategorySelect
        categories={categories}
        loading={categoriesLoading}
        value={defaultCategory}
        onChange={onCategoryChange}
        label="Varsayılan kategori (JSON içinde `categorySlug` yoksa buraya düşer)"
      />

      <div className={styles.bulkToolbar}>
        <label className={styles.fileBtn}>
          <Upload size={14} />
          <span>.json dosyası seç</span>
          <input
            type="file"
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

      <label className={styles.textareaLabel}>
        <span>JSON içerik</span>
        <textarea
          className={styles.textarea}
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder={SAMPLE_JSON}
          rows={16}
          spellCheck={false}
        />
      </label>

      <div className={styles.parseInfo}>
        {parsed.ok ? (
          <span className={styles.parseOk}>
            JSON geçerli · {parsed.count} kayıt tespit edildi
          </span>
        ) : parsed.error ? (
          <span className={styles.parseErr}>Parse hatası: {parsed.error}</span>
        ) : (
          <span className={styles.parseIdle}>JSON bekleniyor…</span>
        )}
      </div>

      <div className={styles.actions}>
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
        <div className={cls(styles.feedback, feedback.ok ? styles.ok : styles.err)}>
          {feedback.ok ? (
            <>
              <strong>Başarılı.</strong> {feedback.upserted}/{feedback.received} kayıt eklendi.
              {(feedback.errors?.length ?? 0) > 0 && (
                <div className={styles.errorList}>
                  <div>Atlanan {feedback.errors!.length} kayıt:</div>
                  <ul>
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
                <div className={styles.errorList}>
                  Bilinmeyen kategori(ler): {feedback.unknownCategories!.join(", ")}
                </div>
              )}
            </>
          ) : (
            <>
              <strong>Hata:</strong> {feedback.msg}
              {(feedback.errors?.length ?? 0) > 0 && (
                <ul className={styles.errorList}>
                  {feedback.errors!.slice(0, 20).map((e, i) => (
                    <li key={i}>
                      #{e.index + 1} — {friendlyError(e.reason)}
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      )}
    </section>
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

function WordsManager({
  categories,
}: {
  categories: Category[];
}) {
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
    <section className={styles.card}>
      <div className={styles.managerToolbar}>
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
        <div className={styles.searchRow}>
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
      </div>

      {error && <div className={cls(styles.feedback, styles.err)}>{error}</div>}

      <div className={styles.wordsList}>
        {loading ? (
          <div className={styles.emptyState}>Yukleniyor...</div>
        ) : words.length === 0 ? (
          <div className={styles.emptyState}>Filtreye uygun kelime bulunamadi.</div>
        ) : (
          words.map((item) => (
            <article key={item.id} className={styles.wordCard}>
              <div className={styles.wordCardHead}>
                <div>
                  <div className={styles.wordTitle}>{item.word}</div>
                  <div className={styles.wordMeta}>
                    {item.category?.icon ? `${item.category.icon} ` : ""}
                    {item.category?.name_tr ?? "Kategori yok"} · Dil: {item.language} · Zorluk:{" "}
                    {item.difficulty} · {item.is_active ? "Aktif" : "Pasif"}
                  </div>
                </div>
                <div className={styles.wordActions}>
                  <Button size="sm" variant="ghost" onClick={() => setEditing(item)}>
                    Duzenle
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => void removeWord(item.id)}>
                    Sil
                  </Button>
                </div>
              </div>
              <div className={styles.forbiddenTags}>
                {item.forbidden_words.map((f) => (
                  <span key={f} className={styles.tag}>
                    {f}
                  </span>
                ))}
              </div>
            </article>
          ))
        )}
      </div>

      <div className={styles.pagination}>
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
    </section>
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
      word: word.word,
      forbidden: [
        word.forbidden_words[0] ?? "",
        word.forbidden_words[1] ?? "",
        word.forbidden_words[2] ?? "",
        word.forbidden_words[3] ?? "",
        word.forbidden_words[4] ?? "",
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
    <Modal open={open} onClose={onClose} title="Kelimeyi Duzenle">
      {word && (
        <div className={styles.editForm}>
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
          <div className={styles.editMeta}>
            <label className={styles.selectWrap}>
              <span>Zorluk</span>
              <select
                className={styles.select}
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
          <label className={styles.toggleRow}>
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
            />
            <span>Aktif</span>
          </label>
          <div className={styles.forbiddenGrid}>
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
          {error && <div className={cls(styles.feedback, styles.err)}>{error}</div>}
          <div className={styles.actions}>
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
    <label className={styles.selectWrap}>
      <span>{label}</span>
      <select
        className={styles.select}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading || categories.length === 0}
      >
        {loading && <option>Yükleniyor…</option>}
        {!loading && categories.length === 0 && <option>Kategori yok</option>}
        {!loading && allowEmpty && categories.length > 0 && <option value="">{emptyLabel}</option>}
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
