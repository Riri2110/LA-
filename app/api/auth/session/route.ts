import { getSession } from "@/lib/session";
import { json } from "@/lib/api";

export async function GET() {
  const session = await getSession();
  return json({ session });
}
