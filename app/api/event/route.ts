import { NextRequest } from "next/server";
import { getAdminSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";
import { error, json } from "@/lib/api";
import { demoEventClosed, demoSetEventClosed, isDemoMode } from "@/lib/demo-store";

export async function GET() {
  if (isDemoMode()) return json({ submissionsClosed: await demoEventClosed() });
  const { data } = await getAdminSupabase().from("event_settings").select("submissions_closed").eq("id", 1).single();
  return json({ submissionsClosed: data?.submissions_closed ?? false });
}

export async function PATCH(req: NextRequest) {
  if ((await getSession())?.role !== "admin") return error("運営者権限が必要です", 403);
  const { submissionsClosed } = await req.json();
  if (isDemoMode()) {
    const closed = await demoSetEventClosed(Boolean(submissionsClosed));
    return json({ submissionsClosed: closed });
  }
  const { data, error: dbError } = await getAdminSupabase()
    .from("event_settings")
    .update({ submissions_closed: Boolean(submissionsClosed), updated_at: new Date().toISOString() })
    .eq("id", 1)
    .select("submissions_closed")
    .single();
  if (dbError) return error("設定を保存できませんでした", 500);
  return json({ submissionsClosed: data.submissions_closed });
}
