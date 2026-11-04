import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

export type DemoTeam = {
  id: string;
  name: string;
  color: string;
  password_hash: string | null;
  created_at: string;
};

type DemoData = {
  teams: DemoTeam[];
  submissionsClosed: boolean;
  submissions: Record<string, string>;
};

const filePath = path.join(process.cwd(), ".data", "color-hunt.json");

const initialTeams = [
  ["チーム ピンク", "#E6A6B8"],
  ["チーム ブルー", "#7EA6E0"],
  ["チーム グリーン", "#83C5A3"],
  ["チーム イエロー", "#E6C96A"],
] as const;

export function isDemoMode() {
  const url = process.env.SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  return (
    !url ||
    !key ||
    url.includes("実際の") ||
    url.includes("your-project") ||
    key.includes("実際の") ||
    key.includes("your-service")
  );
}

async function read(): Promise<DemoData> {
  try {
    const text = await fs.readFile(filePath, "utf8");
    const data = JSON.parse(text) as Partial<DemoData>;
    return {
      teams: Array.isArray(data.teams) ? data.teams : [],
      submissionsClosed: Boolean(data.submissionsClosed),
      submissions: data.submissions || {},
    };
  } catch {
    const now = new Date().toISOString();
    const data: DemoData = {
      teams: initialTeams.map(([name, color]) => ({
        id: randomUUID(),
        name,
        color,
        password_hash: null,
        created_at: now,
      })),
      submissionsClosed: false,
      submissions: {},
    };
    await write(data);
    return data;
  }
}

async function write(data: DemoData) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
}

export async function demoTeams() {
  return (await read()).teams.sort((a, b) => a.created_at.localeCompare(b.created_at));
}

export async function demoAddTeam(name: string, color: string, passwordHash: string) {
  const data = await read();
  if (data.teams.some((team) => team.name === name)) {
    return { error: "same_name" };
  }
  const team: DemoTeam = {
    id: randomUUID(),
    name,
    color,
    password_hash: passwordHash,
    created_at: new Date().toISOString(),
  };
  data.teams.push(team);
  await write(data);
  return { team };
}

export async function demoUpdateTeam(id: string, values: Partial<Pick<DemoTeam, "name" | "color" | "password_hash">>) {
  const data = await read();
  const team = data.teams.find((item) => item.id === id);
  if (!team) return { error: "not_found" };
  if (values.name && data.teams.some((item) => item.id !== id && item.name === values.name)) {
    return { error: "same_name" };
  }
  Object.assign(team, values);
  await write(data);
  return { team };
}

export async function demoDeleteTeam(id: string) {
  const data = await read();
  data.teams = data.teams.filter((team) => team.id !== id);
  await write(data);
}

export async function demoEventClosed() {
  return (await read()).submissionsClosed;
}

export async function demoSetEventClosed(closed: boolean) {
  const data = await read();
  data.submissionsClosed = closed;
  await write(data);
  return closed;
}

export async function demoSubmissions(teamId: string) {
  const data = await read();
  return Object.entries(data.submissions)
    .filter(([key]) => key.startsWith(`${teamId}:`))
    .map(([key, value]) => ({
      slot: Number(key.split(":")[1]),
      url: String(value),
    }));
}

export async function demoSaveSubmission(teamId: string, slot: number, url: string) {
  const data = await read();
  data.submissions[`${teamId}:${slot}`] = url;
  await write(data);
}
