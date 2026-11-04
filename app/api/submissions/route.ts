import { NextRequest } from "next/server";
import { getAdminSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";
import { error, json } from "@/lib/api";
import { demoTeams, demoSubmissions, demoSaveSubmission, demoEventClosed, isDemoMode } from "@/lib/demo-store";

const BUCKET = "color-hunt-private";

export async function GET() {
  const session = await getSession();
  if (!session) return error("ログインが必要です", 401);

  if (isDemoMode()) {
    const allTeams = await demoTeams();
    const teamRows = session.role === "team"
      ? allTeams.filter((team) => team.id === session.teamId)
      : allTeams;
    const teams = await Promise.all(teamRows.map(async (team) => {
      const submissions = await demoSubmissions(team.id);
      return { id: team.id, name: team.name, color: team.color, count: submissions.length, submissions };
    }));
    return json({ teams });
  }

  const supabase = getAdminSupabase();
  const teamQuery = supabase.from("teams").select("id,name,color").order("created_at");
  const submissionQuery = session.role === "team"
    ? supabase.from("submissions").select("team_id,slot,object_path,updated_at").eq("team_id", session.teamId)
    : supabase.from("submissions").select("team_id,slot,object_path,updated_at");
  const [teamsResult, submissionsResult] = await Promise.all([teamQuery, submissionQuery]);
  if (teamsResult.error || submissionsResult.error) return error("投稿状況を取得できませんでした", 500);

  const teamRows = session.role === "team"
    ? teamsResult.data.filter((team) => team.id === session.teamId)
    : teamsResult.data;
  const urls: Record<string, string> = {};
  await Promise.all(submissionsResult.data.map(async (submission) => {
    const { data } = await supabase.storage.from(BUCKET).createSignedUrl(submission.object_path, 3600);
    if (data?.signedUrl) urls[`${submission.team_id}:${submission.slot}`] = data.signedUrl;
  }));

  return json({
    teams: teamRows.map((team) => {
      const rows = submissionsResult.data.filter((submission) => submission.team_id === team.id);
      return {
        ...team,
        count: rows.length,
        submissions: rows.map((row) => ({
          slot: row.slot,
          updatedAt: row.updated_at,
          url: urls[`${row.team_id}:${row.slot}`] ?? null,
        })),
      };
    }),
  });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (session?.role !== "team") return error("チーム権限が必要です", 403);

  const form = await req.formData();
  const teamId = String(form.get("teamId") || "");
  const slotText = String(form.get("slot") || "");
  const file = form.get("file");
  if (teamId !== session.teamId) return error("他チームには写真を投稿できません", 403);
  const slot = Number(slotText);
  if (!Number.isInteger(slot) || slot < 0 || slot > 15) return error("お題番号が不正です");
  if (!(file instanceof File)) return error("写真を選択してください");
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return error("JPEG・PNG・WebPのみアップロードできます");
  if (file.size > 8 * 1024 * 1024) return error("1枚は8MB以下にしてください");

  if (isDemoMode()) {
    if (await demoEventClosed()) return error("投稿期間は終了しています", 403);
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const uploadDir = path.join(process.cwd(), "public", "uploads", teamId);
    await fs.mkdir(uploadDir, { recursive: true });
    const filename = `${slot}.jpg`;
    await fs.writeFile(path.join(uploadDir, filename), new Uint8Array(await file.arrayBuffer()));
    await demoSaveSubmission(teamId, slot, `/uploads/${teamId}/${filename}`);
    return json({ ok: true });
  }

  const supabase = getAdminSupabase();
  const { data: event } = await supabase.from("event_settings").select("submissions_closed").eq("id", 1).single();
  if (event?.submissions_closed) return error("投稿期間は終了しています", 403);

  const objectPath = `${teamId}/${slot}.jpg`;
  const bytes = new Uint8Array(await file.arrayBuffer());
  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(objectPath, bytes, {
    contentType: "image/jpeg",
    cacheControl: "3600",
    upsert: true,
  });
  if (uploadError) return error("写真の保存に失敗しました", 500);

  const { error: dbError } = await supabase.from("submissions").upsert({
    team_id: teamId,
    slot,
    object_path: objectPath,
    updated_at: new Date().toISOString(),
  }, { onConflict: "team_id,slot" });
  if (dbError) {
    await supabase.storage.from(BUCKET).remove([objectPath]);
    return error("投稿情報の保存に失敗しました", 500);
  }
  return json({ ok: true });
}
