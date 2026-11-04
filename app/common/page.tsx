"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TOPICS } from "@/lib/topics";

type Team = { id: string; name: string; color: string; count: number; submissions: { slot: number; url: string | null }[] };

export default function CommonPage() {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);

  async function load() {
    const sessionRes = await fetch("/api/auth/session");
    const sessionData = await sessionRes.json();
    if (sessionData.session?.role !== "admin") {
      router.replace("/");
      return;
    }
    const res = await fetch("/api/submissions");
    const data = await res.json();
    setTeams(data.teams || []);
  }

  useEffect(() => {
    const initial = window.setTimeout(() => void load(), 0);
    const timer = window.setInterval(load, 3000);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(timer);
    };
  }, []);

  return (
    <main className="min-h-screen pb-16">
      <header className="border-b border-[#efefef] bg-white px-4 py-4">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <div><p className="text-xs tracking-[0.2em] text-[#999]">ADMIN VIEW</p><h1 className="text-xl font-black">ALL TEAMS</h1></div>
          <a href="/admin" className="rounded-full border border-[#e8e8e8] px-3 py-2 text-xs text-[#666] no-underline">運営画面へ</a>
        </div>
      </header>
      <section className="mx-auto max-w-6xl px-4 pt-6">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {teams.map((team) => {
            const urls = new Map(team.submissions.map((item) => [item.slot, item.url]));
            return (
              <article key={team.id} className="rounded-3xl bg-white p-4 shadow-[0_8px_30px_rgba(0,0,0,.05)]">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ background: team.color }} /><h2 className="font-black">{team.name}</h2></div>
                  <span className="text-sm font-bold text-[#777]">{team.count}/16 <span className="ml-1 text-xs">{Math.round(team.count / 16 * 100)}%</span></span>
                </div>
                <div className="grid grid-cols-4 gap-0 overflow-hidden rounded-[4px]">
                  {TOPICS.map((topic, slot) => {
                    const url = urls.get(slot);
                    return (
                      <div key={topic} className="relative aspect-square overflow-hidden bg-[#f4f4f4]" title={topic}>
                        {url ? <img src={url} alt={`${team.name} ${topic}`} className="h-full w-full object-cover" /> : <span className="absolute inset-0 flex items-center justify-center text-[#ccc]">—</span>}
                      </div>
                    );
                  })}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
