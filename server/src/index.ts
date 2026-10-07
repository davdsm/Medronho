import path from "node:path";
import { createApp } from "./app.js";
import { ensureAdmin, seedPosts } from "./bootstrap.js";
import { loadConfig } from "./config.js";
import { openDb } from "./db.js";

const config = loadConfig();
const db = openDb(path.join(config.dataDir, "unedo4all.db"));

const seeded = seedPosts(db, config.sharedDir);
if (seeded > 0) console.log(`Notícias iniciais importadas: ${seeded}`);
await ensureAdmin(db, config);

const app = createApp({ config, db });
const server = app.listen(config.port, config.host, () => {
  console.log(`API a correr em http://${config.host}:${config.port} (dados em ${config.dataDir})`);
});

function shutdown(signal: string) {
  console.log(`${signal} recebido — a terminar…`);
  server.close(() => {
    db.close();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
