import fs from "node:fs";
import path from "node:path";
import type { Config } from "./config.js";
import type { Db } from "./db.js";
import { createPost, postInput } from "./posts.js";
import { generatePassword } from "./security.js";
import { createUser, findByEmail } from "./users.js";
import { parse } from "./validation.js";

/** Importa as notícias iniciais (só na primeira execução). */
export function seedPosts(db: Db, sharedDir: string): number {
  const done = db.prepare("SELECT value FROM meta WHERE key = 'posts_seeded'").get();
  if (done) return 0;
  const file = path.join(sharedDir, "posts.seed.json");
  const seed = JSON.parse(fs.readFileSync(file, "utf8")) as Array<Record<string, unknown>>;
  for (const item of seed) {
    const { featuredOrder: _order, ...rest } = item;
    createPost(db, parse(postInput, rest));
  }
  db.prepare("INSERT INTO meta (key, value) VALUES ('posts_seeded', '1')").run();
  return seed.length;
}

/** Cria o primeiro administrador se ainda não existir nenhum utilizador. */
export async function ensureAdmin(
  db: Db,
  config: Config,
  log: (message: string) => void = console.log,
): Promise<{ created: boolean; password?: string }> {
  const count = (db.prepare("SELECT COUNT(*) AS n FROM users").get() as { n: number }).n;
  if (count > 0) return { created: false };
  const generated = !config.adminPassword;
  const password = config.adminPassword ?? generatePassword();
  await createUser(db, config, {
    email: config.adminEmail.toLowerCase(),
    name: config.adminName,
    role: "admin",
    password,
  });
  if (generated) {
    log("=".repeat(64));
    log("  Administrador inicial criado");
    log(`  Email:          ${config.adminEmail}`);
    log(`  Palavra-passe:  ${password}`);
    log("  (apresentada apenas agora — altere-a em «A minha conta»)");
    log("=".repeat(64));
  } else {
    log(`Administrador inicial criado: ${config.adminEmail}`);
  }
  return { created: true, password: generated ? password : undefined };
}

export { findByEmail };
