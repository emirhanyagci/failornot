"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Lock, User } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import styles from "./admin.module.css";

export function AdminLogin() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        if (data?.error === "INVALID_CREDENTIALS") {
          setError("Kullanıcı adı ya da parola hatalı.");
        } else {
          setError("Giriş başarısız.");
        }
        return;
      }
      router.refresh();
    } catch {
      setError("Sunucuya ulaşılamadı.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.loginWrap}>
      <form className={styles.loginCard} onSubmit={onSubmit}>
        <h1 className={styles.title}>Admin Girişi</h1>
        <p className={styles.subtitle}>Kelime yönetimine erişmek için giriş yap.</p>

        <Input
          label="Kullanıcı adı"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          autoFocus
          required
        />
        <Input
          label="Parola"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />

        {error && <div className={styles.error}>{error}</div>}

        <Button type="submit" variant="primary" fullWidth loading={loading} icon={<Lock size={16} />}>
          Giriş Yap
        </Button>

        <div className={styles.hint}>
          <User size={14} /> Kredensiyalleri `.env.local` içinden değiştirebilirsin.
        </div>
      </form>
    </div>
  );
}
