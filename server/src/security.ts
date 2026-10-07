import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import jwt from "jsonwebtoken";
import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { Config } from "./config.js";
import type { Db } from "./db.js";
import { forbidden, unauthorized } from "./errors.js";

export const COOKIE_NAME = "unedo_session";
export const CSRF_HEADER_VALUE = "XMLHttpRequest";

export type Role = "admin" | "editor";
export type SessionUser = { id: number; email: string; name: string; role: Role };

declare module "express-serve-static-core" {
  interface Request {
    user?: SessionUser;
  }
}

export const MIN_PASSWORD = 10;

export function hashPassword(password: string, rounds: number) {
  return bcrypt.hash(password, rounds);
}

export function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function generatePassword(): string {
  // 20 caracteres sem símbolos ambíguos.
  const alphabet = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.randomBytes(20);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

/** Segredo JWT: variável de ambiente ou ficheiro persistente gerado no primeiro arranque. */
export function resolveJwtSecret(config: Config): string {
  if (config.jwtSecret) {
    if (config.jwtSecret.length < 32) {
      throw new Error("JWT_SECRET deve ter pelo menos 32 caracteres.");
    }
    return config.jwtSecret;
  }
  if (config.memoryDb) return crypto.randomBytes(48).toString("hex");
  fs.mkdirSync(config.dataDir, { recursive: true });
  const file = path.join(config.dataDir, "jwt.secret");
  if (fs.existsSync(file)) return fs.readFileSync(file, "utf8").trim();
  const secret = crypto.randomBytes(48).toString("hex");
  fs.writeFileSync(file, secret, { mode: 0o600 });
  return secret;
}

export type Auth = ReturnType<typeof createAuth>;

export function createAuth(config: Config, db: Db, secret: string) {
  const maxAgeMs = config.sessionHours * 3600 * 1000;

  function sign(user: { id: number; token_version: number }) {
    return jwt.sign({ sub: String(user.id), tv: user.token_version }, secret, {
      algorithm: "HS256",
      expiresIn: `${config.sessionHours}h`,
    });
  }

  function setCookie(res: Response, token: string) {
    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: config.cookieSecure,
      path: "/",
      maxAge: maxAgeMs,
    });
  }

  function clearCookie(res: Response) {
    res.clearCookie(COOKIE_NAME, {
      httpOnly: true,
      sameSite: "lax",
      secure: config.cookieSecure,
      path: "/",
    });
  }

  function userFromRequest(req: Request): SessionUser | null {
    const token = req.cookies?.[COOKIE_NAME];
    if (typeof token !== "string" || token === "") return null;
    let payload: jwt.JwtPayload;
    try {
      const decoded = jwt.verify(token, secret, { algorithms: ["HS256"] });
      if (typeof decoded === "string") return null;
      payload = decoded;
    } catch {
      return null;
    }
    const id = Number.parseInt(String(payload.sub), 10);
    if (!Number.isInteger(id)) return null;
    const row = db
      .prepare("SELECT id, email, name, role, token_version FROM users WHERE id = ?")
      .get(id) as
      | { id: number; email: string; name: string; role: Role; token_version: number }
      | undefined;
    if (!row || row.token_version !== payload.tv) return null;
    return { id: row.id, email: row.email, name: row.name, role: row.role };
  }

  const requireAuth: RequestHandler = (req, _res, next) => {
    const user = userFromRequest(req);
    if (!user) return next(unauthorized());
    req.user = user;
    next();
  };

  const requireAdmin: RequestHandler = (req, _res, next) => {
    if (req.user?.role !== "admin") return next(forbidden("Apenas administradores."));
    next();
  };

  return { sign, setCookie, clearCookie, userFromRequest, requireAuth, requireAdmin };
}

/**
 * Proteção CSRF para pedidos que alteram dados:
 *  - exige o cabeçalho `X-Requested-With` (um formulário externo não o consegue enviar);
 *  - se houver `Origin`, tem de ser o próprio host ou uma origem configurada.
 */
export function csrfGuard(config: Config): RequestHandler {
  const safe = new Set(["GET", "HEAD", "OPTIONS"]);
  return (req: Request, _res: Response, next: NextFunction) => {
    if (safe.has(req.method)) return next();
    if (req.get("x-requested-with") !== CSRF_HEADER_VALUE) {
      return next(forbidden("Pedido rejeitado (cabeçalho de segurança em falta)."));
    }
    const origin = req.get("origin");
    if (origin) {
      let host: string;
      try {
        host = new URL(origin).host;
      } catch {
        return next(forbidden("Origem inválida."));
      }
      const normalized = origin.replace(/\/+$/, "");
      if (host !== req.get("host") && !config.allowedOrigins.includes(normalized)) {
        return next(forbidden("Origem não permitida."));
      }
    }
    next();
  };
}

export function validatePasswordStrength(password: string, email?: string): string | null {
  if (password.length < MIN_PASSWORD) return `A palavra-passe deve ter pelo menos ${MIN_PASSWORD} caracteres.`;
  if (password.length > 128) return "A palavra-passe é demasiado longa (máximo 128 caracteres).";
  if (email && password.toLowerCase() === email.toLowerCase()) {
    return "A palavra-passe não pode ser igual ao email.";
  }
  return null;
}
