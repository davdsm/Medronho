import fs from "node:fs";
import type { AddressInfo } from "node:net";
import os from "node:os";
import path from "node:path";
import { createApp } from "../src/app.js";
import { ensureAdmin, seedPosts } from "../src/bootstrap.js";
import { loadConfig, type Config } from "../src/config.js";
import { openDb } from "../src/db.js";

process.env.NODE_ENV = "test";

export const ADMIN_EMAIL = "admin@test.local";
export const ADMIN_PASSWORD = "palavra-passe-longa-1";
export const sharedDir = path.resolve(import.meta.dirname, "..", "..", "shared");

export async function startServer(overrides: Partial<Config> = {}) {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "unedo-test-"));
  const config = loadConfig({}, {
    memoryDb: true,
    dataDir,
    bcryptRounds: 4,
    loginMax: 5,
    sharedDir,
    adminEmail: ADMIN_EMAIL,
    adminPassword: ADMIN_PASSWORD,
    jwtSecret: "x".repeat(48),
    ...overrides,
  });
  fs.mkdirSync(config.uploadsDir, { recursive: true });
  const db = openDb(":memory:");
  seedPosts(db, config.sharedDir);
  await ensureAdmin(db, config, () => {});
  const app = createApp({ config, db });
  const server = app.listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  return {
    base,
    config,
    db,
    async close() {
      await new Promise((r) => server.close(r));
      fs.rmSync(dataDir, { recursive: true, force: true });
    },
  };
}

/** Cliente HTTP mínimo com cookie jar e cabeçalho CSRF. */
export class Client {
  cookie = "";
  constructor(public base: string) {}
  async req(method: string, url: string, body?: unknown, extra: Record<string, string> = {}) {
    const headers: Record<string, string> = { "X-Requested-With": "XMLHttpRequest", ...extra };
    if (this.cookie) headers.cookie = this.cookie;
    let payload: BodyInit | undefined;
    if (body instanceof FormData) payload = body;
    else if (body !== undefined) {
      headers["content-type"] = "application/json";
      payload = JSON.stringify(body);
    }
    const res = await fetch(this.base + url, { method, headers, body: payload });
    const set = res.headers.getSetCookie?.() ?? [];
    for (const c of set) {
      const pair = c.split(";")[0]!;
      if (pair.endsWith("=")) this.cookie = "";
      else this.cookie = pair;
    }
    const text = await res.text();
    let json: any = null;
    try { json = text ? JSON.parse(text) : null; } catch { /* não JSON */ }
    return { status: res.status, json, text, headers: res.headers };
  }
  get = (u: string) => this.req("GET", u);
  post = (u: string, b?: unknown) => this.req("POST", u, b ?? {});
  put = (u: string, b?: unknown) => this.req("PUT", u, b ?? {});
  del = (u: string) => this.req("DELETE", u);
  async login(email = ADMIN_EMAIL, password = ADMIN_PASSWORD) {
    return this.post("/api/auth/login", { email, password });
  }
}

export const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==",
  "base64",
);

export const validPost = (over: Record<string, unknown> = {}) => ({
  title: "Notícia de teste",
  excerpt: "Resumo da notícia de teste.",
  body: ["Primeiro parágrafo.", "Segundo parágrafo."],
  image: "/photos/foto-1.jpg",
  imageAlt: "Descrição da imagem",
  author: "Equipa",
  category: "Projeto",
  publishedAt: "2026-10-01",
  status: "published",
  featured: false,
  ...over,
});
