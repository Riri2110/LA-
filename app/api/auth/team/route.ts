import { NextRequest } from "next/server";
import { getAdminSupabase } from "@/lib/supabase";
import { verifyPassword } from "@/lib/password";
import { setSession } from "@/lib/session";
import { error, json } from "@/lib/api";
import { demoTeams, isDemoMode } from "@/lib/demo-store";

export async function POST(req: NextRequest) {
  const { teamId, password } = await req.json();
  if (!teamId || typeof password !== "string") return error("入力内容を確認してください");

  if (isDemoMode()) {
    const team = (await demoTeams()).find((item) => item.id === teamId);
    if (!team) return error("チームが見つかりません", 404);
    if (!verifyPassword(password, team.password_hash)) return error("パスワードが違います", 401);
    await setSession({ role: "team", teamId: team.id, exp: Date.now() + 30 * 24 * 60 * 60 * 1000 });
    return json({ team: { id: team.id, name: team.name } });
  }

  const supabase = getAdminSupabase();
  const { data: team, error: dbError } = await supabase
    .from("teams")
    .select("id,name,password_hash")
    .eq("id", teamId)
    .single();
  if (dbError || !team) return error("チームが見つかりません", 404);
  if (!verifyPassword(password, team.password_hash)) return error("パスワードが違います", 401);

  await setSession({ role: "team", teamId: team.id, exp: Date.now() + 30 * 24 * 60 * 60 * 1000 });
  return json({ team: { id: team.id, name: team.name } });
}
