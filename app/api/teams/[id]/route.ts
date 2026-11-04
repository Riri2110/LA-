import { NextRequest } from "next/server";
import { getAdminSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";
import { hashPassword } from "@/lib/password";
import { error, json } from "@/lib/api";
import { demoDeleteTeam, demoUpdateTeam, isDemoMode } from "@/lib/demo-store";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (session?.role !== "admin") return error("運営者権限が必要です", 403);
  const { name, color, password } = await req.json();
  const values: Record<string, string> = {};
  if (name?.trim()) values.name = name.trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(color || "")) values.color = color;
  if (typeof password === "string" && password) values.password_hash = hashPassword(password);
  if (!Object.keys(values).length) return error("更新項目がありません");
  if (isDemoMode()) {
    const result = await demoUpdateTeam(id, values);
    if ("error" in result) {
      return error(result.error === "same_name" ? "同じチーム名があります" : "チームが見つかりません", result.error === "same_name" ? 400 : 404);
    }
    const { password_hash: _passwordHash, ...team } = result.team;
    void _passwordHash;
    return json({ team });
  }
  const { data, error: dbError } = await getAdminSupabase().from("teams").update(values).eq("id", id).select("id,name,color,created_at").single();
  if (dbError) return error(dbError.code === "23505" ? "同じチーム名があります" : "更新できませんでした", 400);
  return json({ team: data });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (session?.role !== "admin") return error("運営者権限が必要です", 403);
  if (isDemoMode()) {
    await demoDeleteTeam(id);
    return json({ ok: true });
  }
  const supabase = getAdminSupabase();
  const { data: files } = await supabase.storage.from("color-hunt-private").list(id);
  if (files?.length) {
    await supabase.storage.from("color-hunt-private").remove(files.map((file) => `${id}/${file.name}`));
  }
  const { error: dbError } = await supabase.from("teams").delete().eq("id", id);
  if (dbError) return error("削除できませんでした", 500);
  return json({ ok: true });
}
