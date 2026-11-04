"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Team = { id: string; name: string; color: string };

export default function TeamLogin() {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamId, setTeamId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/teams").then((res) => res.json()).then((data) => {
      setTeams(data.teams || []);
      if (data.teams?.[0]) setTeamId(data.teams[0].id);
    });
  }, []);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/team", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ teamId, password }) });
    const data = await res.json();
    if (!res.ok) setError(data.error || "ログインできませんでした");
    else router.push("/team");
    setLoading(false);
  }

  return (
    <main className="min-h-screen px-5 py-10 flex justify-center">
      <form onSubmit={login} className="w-full max-w-md">
        <button type="button" onClick={() => router.push("/")} className="mb-10 border-0 bg-transparent text-[#777] p-0">← トップへ</button>
        <h1 className="text-2xl font-black mb-2">チームで参加</h1>
        <p className="text-sm text-[#888] mb-7">チームを選んでパスワードを入力してください</p>
        <label className="block text-sm font-bold mb-2">チーム名</label>
        <select value={teamId} onChange={(e) => setTeamId(e.target.value)} className="w-full h-14 rounded-2xl border border-[#e4e4e4] bg-white px-4 mb-5 outline-none">
          {teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
        </select>
        <label className="block text-sm font-bold mb-2">パスワード</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full h-14 rounded-2xl border border-[#e4e4e4] bg-white px-4 mb-4 outline-none" />
        {error && <p className="text-sm text-[#b84b5f] mb-4">{error}</p>}
        <button disabled={loading || !teamId} className="w-full h-14 rounded-2xl border-0 bg-[#252525] text-white font-bold disabled:opacity-50">{loading ? "確認中..." : "ログイン"}</button>
      </form>
    </main>
  );
}
