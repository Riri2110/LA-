"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/auth/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
    const data = await res.json();
    if (!res.ok) setError(data.error || "ログインできませんでした");
    else router.push("/admin");
    setLoading(false);
  }

  return (
    <main className="min-h-screen px-5 py-10 flex justify-center">
      <form onSubmit={login} className="w-full max-w-md">
        <button type="button" onClick={() => router.push("/")} className="mb-10 border-0 bg-transparent text-[#777] p-0">← トップへ</button>
        <h1 className="text-2xl font-black mb-2">運営者ログイン</h1>
        <p className="text-sm text-[#888] mb-7">運営者用パスワードを入力してください</p>
        <label className="block text-sm font-bold mb-2">パスワード</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full h-14 rounded-2xl border border-[#e4e4e4] bg-white px-4 mb-4 outline-none" />
        {error && <p className="text-sm text-[#b84b5f] mb-4">{error}</p>}
        <button disabled={loading} className="w-full h-14 rounded-2xl border-0 bg-[#252525] text-white font-bold">{loading ? "確認中..." : "ログイン"}</button>
      </form>
    </main>
  );
}
