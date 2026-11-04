import { NextRequest } from "next/server";
import { timingSafeEqual } from "crypto";
import { setSession } from "@/lib/session";
import { error, json } from "@/lib/api";

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return error("運営者パスワードがサーバーに設定されていません", 500);
  if (typeof password !== "string") return error("パスワードを入力してください");

  const a = Buffer.from(password);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return error("パスワードが違います", 401);

  await setSession({ role: "admin", exp: Date.now() + 12 * 60 * 60 * 1000 });
  return json({ ok: true });
}
