"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { TOPICS } from "@/lib/topics";

type Submission = { slot: number; url: string | null };
type Team = { id: string; name: string; color: string; count: number; submissions: Submission[] };

async function compressImage(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const max = 1600;
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("画像を処理できませんでした");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((value) => value ? resolve(value) : reject(new Error("画像を圧縮できませんでした")), "image/jpeg", 0.78);
  });
  return new File([blob], "photo.jpg", { type: "image/jpeg" });
}

export default function TeamPage() {
  const router = useRouter();
  const [team, setTeam] = useState<Team | null>(null);
  const [closed, setClosed] = useState(false);
  const [uploading, setUploading] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function load() {
    const sessionRes = await fetch("/api/auth/session");
    const sessionData = await sessionRes.json();
    if (sessionData.session?.role !== "team") {
      router.replace("/team-login");
      return;
    }
    const [dataRes, eventRes] = await Promise.all([fetch("/api/submissions"), fetch("/api/event")]);
    const data = await dataRes.json();
    const event = await eventRes.json();
    setTeam(data.teams?.[0] || null);
    setClosed(event.submissionsClosed);
  }

  useEffect(() => {
    const initial = window.setTimeout(() => void load(), 0);
    const timer = window.setInterval(load, 5000);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(timer);
    };
  }, []);

  async function upload(slot: number, file: File) {
    if (!team || closed) return;
    try {
      setUploading(slot);
      const compressed = await compressImage(file);
      const form = new FormData();
      form.append("teamId", team.id);
      form.append("slot", String(slot));
      form.append("file", compressed);
      const res = await fetch("/api/submissions", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) alert(data.error || "アップロードできませんでした");
      else await load();
    } catch (error) {
      alert(error instanceof Error ? error.message : "アップロードできませんでした");
    } finally {
      setUploading(null);
    }
  }

  if (!team) return <main className="min-h-screen flex items-center justify-center text-[#888]">読み込み中...</main>;
  const count = team.count || 0;
  const bySlot = new Map(team.submissions.map((item) => [item.slot, item.url]));

  return (
    <main className="min-h-screen pb-24">
      <header className="sticky top-0 z-20 border-b border-[#efefef] bg-white/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto max-w-md flex items-center justify-between">
          <div>
            <p className="text-xs text-[#999] mb-0.5">MY TEAM</p>
            <h1 className="text-lg font-black" style={{ color: team.color }}>{team.name}</h1>
          </div>
          <button onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); router.push("/"); }} className="rounded-full border border-[#e8e8e8] bg-white px-3 py-2 text-xs text-[#777]">ログアウト</button>
        </div>
      </header>
      <section className="mx-auto max-w-md px-3 pt-5">
        <div className="mb-4 rounded-2xl bg-white p-4 shadow-[0_5px_20px_rgba(0,0,0,.04)]">
          <div className="flex items-end justify-between mb-2">
            <div><span className="text-2xl font-black">{count}</span><span className="text-sm text-[#888]"> / 16枚</span></div>
            {count === 16 && <span className="rounded-full bg-[#252525] px-3 py-1 text-xs font-bold text-white">COMPLETE</span>}
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[#eee]"><div className="h-full rounded-full transition-all" style={{ width: `${count / 16 * 100}%`, background: team.color }} /></div>
          {closed && <p className="mt-3 text-xs font-bold text-[#b84b5f]">投稿期間は終了しています</p>}
        </div>
        <div className="grid grid-cols-4 gap-0 overflow-hidden rounded-[4px]">
          {TOPICS.map((topic, slot) => {
            const url = bySlot.get(slot);
            return (
              <label key={topic} className="relative aspect-square overflow-hidden border-0 bg-white">
                {url ? <img src={url} alt={topic} className="h-full w-full object-cover" /> : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-1 text-center">
                    <span className="mb-1 text-lg text-[#bbb]">＋</span>
                  </div>
                )}
                {!closed && (
                  <>
                    <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) upload(slot, file); e.target.value = ""; }} />
                    {uploading === slot && <span className="absolute inset-0 flex items-center justify-center bg-white/80 text-xs font-bold">処理中</span>}
                  </>
                )}
              </label>
            );
          })}
        </div>
      </section>
    </main>
  );
}
