import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password: string, stored: string | null) {
  if (!stored) return false;
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const hash = Buffer.from(scryptSync(password, parts[1], 64).toString("hex"), "hex");
  const expected = Buffer.from(parts[2], "hex");
  return expected.length === hash.length && timingSafeEqual(expected, hash);
}
