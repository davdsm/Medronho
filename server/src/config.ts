import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

export type Config = {
  port: number;
  host: string;
  /** Pasta persistente: base de dados, uploads e segredo da sessão. */
  dataDir: string;
  uploadsDir: string;
  /** Pasta `shared/` do repositório (textos predefinidos e notícias iniciais). */
  sharedDir: string;
  jwtSecret: string | undefined;
  cookieSecure: boolean;
  sessionHours: number;
  /** URL público do site (sitemap). */
  siteUrl: string;
  /** Origens extra aceites em pedidos que alteram dados (além do próprio host). */
  allowedOrigins: string[];
  trustProxy: string;
  adminEmail: string;
  adminName: string;
  adminPassword: string | undefined;
  maxUploadMb: number;
  bcryptRounds: number;
  loginMax: number;
  /** Base de dados em memória (testes). */
  memoryDb: boolean;
};

function int(value: string | undefined, fallback: number): number {
  if (value === undefined || value.trim() === "") return fallback;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
}

export function loadConfig(
  env: NodeJS.ProcessEnv = process.env,
  overrides: Partial<Config> = {},
): Config {
  const dataDir = path.resolve(env.DATA_DIR?.trim() || "./data");
  const config: Config = {
    port: int(env.PORT, 3001),
    host: env.HOST?.trim() || "0.0.0.0",
    dataDir,
    uploadsDir: path.join(dataDir, "uploads"),
    sharedDir: path.resolve(env.SHARED_DIR?.trim() || path.join(here, "..", "..", "shared")),
    jwtSecret: env.JWT_SECRET?.trim() || undefined,
    cookieSecure: env.COOKIE_SECURE === "true",
    sessionHours: int(env.SESSION_HOURS, 12),
    siteUrl: (env.SITE_URL?.trim() || "http://localhost:8080").replace(/\/+$/, ""),
    allowedOrigins: (env.ALLOWED_ORIGINS ?? "http://localhost:5173,http://127.0.0.1:5173")
      .split(",")
      .map((o) => o.trim().replace(/\/+$/, ""))
      .filter(Boolean),
    trustProxy: env.TRUST_PROXY?.trim() || "loopback, linklocal, uniquelocal",
    adminEmail: env.ADMIN_EMAIL?.trim() || "admin@unedo4all.local",
    adminName: env.ADMIN_NAME?.trim() || "Administrador",
    adminPassword: env.ADMIN_PASSWORD || undefined,
    maxUploadMb: int(env.MAX_UPLOAD_MB, 8),
    bcryptRounds: int(env.BCRYPT_ROUNDS, 12),
    loginMax: int(env.LOGIN_MAX_ATTEMPTS, 10),
    memoryDb: false,
    ...overrides,
  };
  if (overrides.dataDir && !overrides.uploadsDir) {
    config.uploadsDir = path.join(overrides.dataDir, "uploads");
  }
  return config;
}
