import path from "node:path";
import { loadConfig } from "./config.js";
import { nowIso, openDb } from "./db.js";
import { generatePassword, hashPassword, validatePasswordStrength } from "./security.js";
import { findByEmail, listUsers } from "./users.js";

const [command, ...args] = process.argv.slice(2);
const config = loadConfig();
const db = openDb(path.join(config.dataDir, "unedo4all.db"));

function usage(): never {
  console.log(`Utilização:
  node dist/cli.js list-users
  node dist/cli.js reset-password <email> [nova-palavra-passe]
    (sem palavra-passe, é gerada uma nova e apresentada aqui)`);
  process.exit(1);
}

if (command === "list-users") {
  for (const u of listUsers(db)) console.log(`${u.id}\t${u.role}\t${u.email}\t${u.name}`);
} else if (command === "reset-password") {
  const [email, given] = args;
  if (!email) usage();
  const user = findByEmail(db, email.toLowerCase());
  if (!user) {
    console.error(`Utilizador não encontrado: ${email}`);
    process.exit(1);
  }
  const password = given ?? generatePassword();
  const problem = validatePasswordStrength(password, user.email);
  if (problem) {
    console.error(problem);
    process.exit(1);
  }
  const hash = await hashPassword(password, config.bcryptRounds);
  db.prepare("UPDATE users SET password_hash = ?, token_version = token_version + 1, updated_at = ? WHERE id = ?").run(
    hash,
    nowIso(),
    user.id,
  );
  console.log(`Palavra-passe de ${user.email} atualizada.`);
  if (!given) console.log(`Nova palavra-passe: ${password}`);
} else {
  usage();
}
db.close();
