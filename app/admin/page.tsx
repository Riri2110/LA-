"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Team = { id: string; name: string; color: string; password_hash?: string; count?: number };

export default function AdminPage() {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [closed, setClosed] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#E6A6B8");
  const [password, setPassword] = useState("");
  const [editing, setEditing] = useState<string | null>(null);

  async function load() {
    const sessionRes = await fetch("/api/auth/session");
    const sessionData = await sessionRes.json();
    if (sessionData.session?.role !== "admin") {
      router.replace("/admin-login");
      return;
    }
    const [teamsRes, submissionsRes, eventRes] = await Promise.all([
      fetch("/api/teams"),
      fetch("/api/submissions"),
      fetch("/api/event"),
    ]);
    const teamsData = await teamsRes.json();
    const submissionsData = await submissionsRes.json();
    const eventData = await eventRes.json();
    setTeams(teamsData.teams || []);
    setCounts(Object.fromEntries((submissionsData.teams || []).map((team: Team & { count: number }) => [team.id, team.count])));
    setClosed(eventData.submissionsClosed);
  }

  useEffect(() => {
    const initial = window.setTimeout(() => void load(), 0);
    const timer = window.setInterval(load, 5000);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(timer);
    };
  }, []);

  async function saveTeam(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || (!editing && !password)) {
      alert("チーム名とパスワードを入力してください");
      return;
    }
    const res = await fetch(editing ? `/api/teams/${editing}` : "/api/teams", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, color, password: password || undefined }),
    });
    const data = await res.json();
    if (!res.ok) alert(data.error || "保存できませんでした");
    else {
      setName("");
      setColor("#E6A6B8");
      setPassword("");
      setEditing(null);
      await load();
    }
  }

  async function editTeam(team: Team) {
    setEditing(team.id);
    setName(team.name);
    setColor(team.color);
    setPassword("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deleteTeam(team: Team) {
    if (!confirm(`${team.name} を削除しますか？投稿写真も削除されます。`)) return;
    const res = await fetch(`/api/teams/${team.id}`, { method: "DELETE" });
    if (!res.ok) alert("削除できませんでした");
    else await load();
  }

  async function toggleEvent() {
    const res = await fetch("/api/event", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submissionsClosed: !closed }),
    });
    const data = await res.json();
    if (res.ok) setClosed(data.submissionsClosed);
  }

  return (
    <main className="min-h-screen pb-16">
      <header className="sticky top-0 z-20 border-b border-[#efefef] bg-white px-4 py-4">
        <div className="mx-auto max-w-3xl flex items-center justify-between">
          <div><p className="text-xs tracking-[0.2em] text-[#999]">ADMIN</p><h1 className="text-xl font-black">運営画面</h1></div>
          <div className="flex gap-2">
            <a href="/common" className="rounded-full border border-[#e8e8e8] px-3 py-2 text-xs text-[#666] no-underline">全チーム一覧</a>
            <button onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); router.push("/"); }} className="rounded-full border border-[#e8e8e8] bg-white px-3 py-2 text-xs text-[#777]">ログアウト</button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-4 pt-6">
        <div className="mb-6 rounded-3xl bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,.05)]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-black">投稿受付</h2>
              <p className="text-xs text-[#888]">{closed ? "現在停止中" : "現在受付中"}</p>
            </div>
            <button onClick={toggleEvent} className={`rounded-full px-4 py-2 text-sm font-bold border-0 text-white ${closed ? "bg-[#999]" : "bg-[#252525]"}`}>{closed ? "受付を再開" : "イベント終了"}</button>
          </div>
        </div>

        <form onSubmit={saveTeam} className="mb-6 rounded-3xl bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,.05)]">
          <h2 className="mb-4 font-black">{editing ? "チームを編集" : "チームを追加"}</h2>
          <div className="grid gap-3 sm:grid-cols-[1fr_110px_1fr]">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="チーム名" className="h-12 rounded-xl border border-[#e5e5e5] px-3 outline-none" />
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-12 w-full rounded-xl border border-[#e5e5e5] bg-white p-1" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={editing ? "新パスワード（変更時のみ）" : "ログインパスワード"} className="h-12 rounded-xl border border-[#e5e5e5] px-3 outline-none" />
          </div>
          <div className="mt-3 flex gap-2">
            <button className="rounded-xl bg-[#252525] px-5 py-3 text-sm font-bold text-white border-0">{editing ? "変更を保存" : "チームを追加"}</button>
            {editing && <button type="button" onClick={() => { setEditing(null); setName(""); setColor("#E6A6B8"); setPassword(""); }} className="rounded-xl border border-[#e5e5e5] bg-white px-5 py-3 text-sm text-[#777]">キャンセル</button>}
          </div>
        </form>

        <div className="grid gap-3">
          {teams.map((team) => {
            const count = counts[team.id] || 0;
            return (
              <article key={team.id} className="rounded-2xl bg-white p-4 shadow-[0_5px_20px_rgba(0,0,0,.04)]">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex items-center gap-3">
                    <span className="h-10 w-10 shrink-0 rounded-full" style={{ background: team.color }} />
                    <div><h3 className="font-black truncate">{team.name}</h3><p className="text-xs text-[#888]">{count}/16枚 · {Math.round(count / 16 * 100)}%</p></div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button onClick={() => editTeam(team)} className="rounded-lg border border-[#e8e8e8] bg-white px-3 py-2 text-xs">編集</button>
                    <button onClick={() => deleteTeam(team)} className="rounded-lg border border-[#f0d3d8] bg-white px-3 py-2 text-xs text-[#b84b5f]">削除</button>
                  </div>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#eee]"><div className="h-full rounded-full" style={{ width: `${count / 16 * 100}%`, background: team.color }} /></div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
