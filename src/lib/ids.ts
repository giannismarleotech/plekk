import { randomBytes, randomUUID } from "node:crypto";

export const id = () => randomUUID();

/** Korte, leesbare code voor klanten: PK-7F3KQ (geen 0/O/1/I). */
export function reference(prefix = "PK") {
  const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  const bytes = randomBytes(6);
  let out = "";
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return `${prefix}-${out}`;
}
