import { NextRequest } from "next/server";
import { getAdminSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";
import { hashPassword } from "@/lib/password";
import { error, json } from "@/lib/api";
import { demoAddTeam, demoTeams, isDemoMode } from "@/lib/demo-store";

export async function GET() {
  const session = await getSession();
  if (isDemoMode()) {
    const teams = await demoTeams();
    if (session?.role === "admin") return json({ teams });
    return json({ teams: teams.map(({ id, name, color }) => ({ id, name, color })) });
  }
  const supabase = getAdminSupabase();
  const adminQuery = session?.role === "admin"
    ? supabase.from("teams").select("id,name,color,password_hash,created_at").order("created_at")
    : supabase.from("teams").select("id,name,color,created_at").order("created_at");
  const { data, error: dbError } = await adminQuery;
  if (dbError) return error("チーム一覧を取得できませんでした", 500);
  if (session?.role === "admin") return json({ teams: data });
  return json({ teams: data?.map(({ id, name, color }) => ({ id, name, color })) });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (session?.role !== "admin") return error("運営者権限が必要です", 403);
  const { name, color, password } = await req.json();
  if (!name?.trim() || !password) return error("チーム名とパスワードを入力してください");
  const passwordHash = hashPassword(password);
  if (isDemoMode()) {
    const result = await demoAddTeam(
      name.trim(),
      /^#[0-9A-Fa-f]{6}$/.test(color || "") ? color : "#E6A6B8",
      passwordHash,
    );
    if ("error" in result) {
      return error("同じチーム名があります", 400);
    }
    const { password_hash: _passwordHash, ...team } = result.team;
    void _passwordHash;
    return json({ team }, 201);
  }
  const { data, error: dbError } = await getAdminSupabase()
    .from("teams")
    .insert({
      name: name.trim(),
      color: /^#[0-9A-Fa-f]{6}$/.test(color || "") ? color : "#E6A6B8",
      password_hash: passwordHash,
    })
    .select("id,name,color,created_at")
    .single();
  if (dbError) return error(dbError.code === "23505" ? "同じチーム名があります" : "チームを追加できませんでした", 400);
  return json({ team: data }, 201);
}
