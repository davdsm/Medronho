import { z } from "zod";
import type { Config } from "./config.js";
import type { Db } from "./db.js";
import { nowIso, transaction } from "./db.js";
import { badRequest, conflict, notFound } from "./errors.js";
import { hashPassword, validatePasswordStrength, type Role } from "./security.js";
import { cleanText } from "./validation.js";

export type UserRow = {
  id: number;
  email: string;
  name: string;
  role: Role;
  password_hash: string;
  token_version: number;
  created_at: string;
  updated_at: string;
};

export type PublicUser = { id: number; email: string; name: string; role: Role; createdAt: string };

export const toPublicUser = (row: UserRow): PublicUser => ({
  id: row.id,
  email: row.email,
  name: row.name,
  role: row.role,
  createdAt: row.created_at,
});

const name = z
  .string()
  .transform((v) => cleanText(v, false))
  .pipe(z.string().min(2).max(100));
const email = z.string().trim().toLowerCase().pipe(z.email().max(200));

export const createUserInput = z
  .object({ email, name, role: z.enum(["admin", "editor"]), password: z.string().max(200) })
  .strict();

export const updateUserInput = z
  .object({ name: name.optional(), role: z.enum(["admin", "editor"]).optional(), password: z.string().max(200).optional() })
  .strict();

export function listUsers(db: Db): PublicUser[] {
  return (db.prepare("SELECT * FROM users ORDER BY created_at ASC, id ASC").all() as UserRow[]).map(toPublicUser);
}

export function findByEmail(db: Db, mail: string): UserRow | undefined {
  return db.prepare("SELECT * FROM users WHERE email = ?").get(mail) as UserRow | undefined;
}

function getRow(db: Db, id: number): UserRow {
  const row = db.prepare("SELECT * FROM users WHERE id = ?").get(id) as UserRow | undefined;
  if (!row) throw notFound("Utilizador não encontrado.");
  return row;
}

function adminCount(db: Db): number {
  return (db.prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'admin'").get() as { n: number }).n;
}

export async function createUser(
  db: Db,
  config: Config,
  input: z.infer<typeof createUserInput>,
): Promise<PublicUser> {
  const problem = validatePasswordStrength(input.password, input.email);
  if (problem) throw badRequest(problem, { password: problem });
  if (findByEmail(db, input.email)) throw conflict("Já existe um utilizador com este email.");
  const hash = await hashPassword(input.password, config.bcryptRounds);
  const now = nowIso();
  const result = db
    .prepare(
      "INSERT INTO users (email, name, role, password_hash, token_version, created_at, updated_at) VALUES (?, ?, ?, ?, 0, ?, ?)",
    )
    .run(input.email, input.name, input.role, hash, now, now);
  return toPublicUser(getRow(db, Number(result.lastInsertRowid)));
}

export async function updateUser(
  db: Db,
  config: Config,
  id: number,
  input: z.infer<typeof updateUserInput>,
): Promise<PublicUser> {
  const current = getRow(db, id);
  if (input.role && input.role !== current.role && current.role === "admin" && adminCount(db) <= 1) {
    throw conflict("Tem de existir pelo menos um administrador.");
  }
  let hash: string | undefined;
  if (input.password !== undefined) {
    const problem = validatePasswordStrength(input.password, current.email);
    if (problem) throw badRequest(problem, { password: problem });
    hash = await hashPassword(input.password, config.bcryptRounds);
  }
  transaction(db, () => {
    const fresh = getRow(db, id);
    if (input.role && input.role !== fresh.role && fresh.role === "admin" && adminCount(db) <= 1) {
      throw conflict("Tem de existir pelo menos um administrador.");
    }
    db.prepare(
      `UPDATE users SET name = ?, role = ?, password_hash = ?, token_version = token_version + ?, updated_at = ? WHERE id = ?`,
    ).run(
      input.name ?? fresh.name,
      input.role ?? fresh.role,
      hash ?? fresh.password_hash,
      // Mudar a palavra-passe ou o papel termina as sessões existentes.
      hash || (input.role && input.role !== fresh.role) ? 1 : 0,
      nowIso(),
      id,
    );
  });
  return toPublicUser(getRow(db, id));
}

export function deleteUser(db: Db, actingId: number, id: number) {
  if (actingId === id) throw conflict("Não pode apagar a sua própria conta.");
  transaction(db, () => {
    const target = getRow(db, id);
    if (target.role === "admin" && adminCount(db) <= 1) {
      throw conflict("Tem de existir pelo menos um administrador.");
    }
    db.prepare("DELETE FROM users WHERE id = ?").run(id);
  });
}

export async function changeOwnPassword(db: Db, config: Config, id: number, newPassword: string) {
  const current = getRow(db, id);
  const problem = validatePasswordStrength(newPassword, current.email);
  if (problem) throw badRequest(problem, { newPassword: problem });
  const hash = await hashPassword(newPassword, config.bcryptRounds);
  db.prepare("UPDATE users SET password_hash = ?, token_version = token_version + 1, updated_at = ? WHERE id = ?").run(
    hash,
    nowIso(),
    id,
  );
  return getRow(db, id);
}
