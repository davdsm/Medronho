import bcrypt from "bcryptjs";
import cookieParser from "cookie-parser";
import express, { type ErrorRequestHandler, type NextFunction, type Request, type Response } from "express";
import { ipKeyGenerator, rateLimit } from "express-rate-limit";
import helmet from "helmet";
import multer from "multer";
import { z } from "zod";
import type { Config } from "./config.js";
import {
  adminContent,
  loadContentSchema,
  publicContent,
  resetContent,
  setContent,
} from "./content.js";
import type { Db } from "./db.js";
import { HttpError, badRequest, notFound, unauthorized } from "./errors.js";
import {
  createPost,
  deletePost,
  getById,
  getPublishedBySlug,
  listAdmin,
  listFeatured,
  listPublished,
  postInput,
  setFeatured,
  toPublic,
  updatePost,
} from "./posts.js";
import {
  createAuth,
  csrfGuard,
  resolveJwtSecret,
  verifyPassword,
  type SessionUser,
} from "./security.js";
import { deleteUpload, listUploads, saveUpload } from "./uploads.js";
import {
  changeOwnPassword,
  createUser,
  createUserInput,
  deleteUser,
  findByEmail,
  listUsers,
  toPublicUser,
  updateUser,
  updateUserInput,
} from "./users.js";
import { parse } from "./validation.js";

const loginInput = z.object({ email: z.string().trim().toLowerCase().max(200), password: z.string().max(200) }).strict();
const passwordInput = z.object({ currentPassword: z.string().max(200), newPassword: z.string().max(200) }).strict();
const featuredInput = z.object({ ids: z.array(z.number().int().positive()).max(50) }).strict();
const contentInput = z.object({ value: z.unknown() }).strict();

function idParam(value: string | undefined): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw notFound();
  return id;
}

const STATIC_PAGES = ["/", "/sobre", "/consorcio", "/noticias", "/privacidade", "/termos"];

function escapeXml(value: string) {
  return value.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]!);
}

export function createApp({ config, db }: { config: Config; db: Db }) {
  const schema = loadContentSchema(config.sharedDir);
  const auth = createAuth(config, db, resolveJwtSecret(config));
  // Hash falso para igualar o tempo de resposta quando o email não existe.
  const dummyHash = bcrypt.hashSync("nao-existe", config.bcryptRounds);

  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", config.trustProxy);
  app.use(helmet());

  app.use((req, res, next) => {
    const started = Date.now();
    res.on("finish", () => {
      const url = req.originalUrl.split("?")[0] ?? "";
      if (url === "/api/health" || process.env.NODE_ENV === "test") return;
      console.log(`${req.method} ${url} ${res.statusCode} ${Date.now() - started}ms`);
    });
    next();
  });

  app.use(
    "/uploads",
    express.static(config.uploadsDir, {
      index: false,
      dotfiles: "deny",
      maxAge: "365d",
      immutable: true,
      setHeaders(res) {
        res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
        res.setHeader("X-Content-Type-Options", "nosniff");
      },
    }),
  );

  const api = express.Router();
  api.use(express.json({ limit: "512kb" }));
  api.use(cookieParser());
  api.use((_req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    next();
  });
  api.use(csrfGuard(config));
  api.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 1000,
      standardHeaders: "draft-7",
      legacyHeaders: false,
      message: { error: "Demasiados pedidos. Tente novamente dentro de alguns minutos." },
    }),
  );

  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: config.loginMax,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    keyGenerator: (req) => {
      const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
      return `${ipKeyGenerator(req.ip ?? "")}|${email}`;
    },
    message: { error: "Demasiadas tentativas de início de sessão. Tente novamente dentro de 15 minutos." },
  });

  // ---------- Público ----------
  api.get("/health", (_req, res) => {
    db.prepare("SELECT 1").get();
    res.json({ ok: true });
  });
  api.get("/content", (_req, res) => {
    res.json(publicContent(db, schema));
  });
  api.get("/posts", (_req, res) => {
    res.json({ posts: listPublished(db).map(toPublic) });
  });
  api.get("/posts/featured", (_req, res) => {
    res.json({ posts: listFeatured(db).map(toPublic) });
  });
  api.get("/posts/:slug", (req, res) => {
    const post = getPublishedBySlug(db, String(req.params.slug));
    if (!post) throw notFound("Notícia não encontrada.");
    res.json({ post: toPublic(post) });
  });

  // ---------- Autenticação ----------
  api.post("/auth/login", loginLimiter, async (req, res) => {
    const input = parse(loginInput, req.body);
    const user = findByEmail(db, input.email);
    const ok = await verifyPassword(input.password, user?.password_hash ?? dummyHash);
    if (!user || !ok) throw unauthorized("Email ou palavra-passe incorretos.");
    auth.setCookie(res, auth.sign(user));
    res.json({ user: toPublicUser(user) });
  });
  api.post("/auth/logout", (_req, res) => {
    auth.clearCookie(res);
    res.json({ ok: true });
  });
  api.get("/auth/me", (req, res) => {
    const user = auth.userFromRequest(req);
    if (!user) throw unauthorized();
    res.json({ user });
  });
  const passwordLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { error: "Demasiadas tentativas. Tente novamente dentro de 15 minutos." },
  });
  api.post("/auth/password", passwordLimiter, auth.requireAuth, async (req, res) => {
    const me = req.user as SessionUser;
    const input = parse(passwordInput, req.body);
    const row = findByEmail(db, me.email);
    if (!row || !(await verifyPassword(input.currentPassword, row.password_hash))) {
      throw badRequest("A palavra-passe atual está incorreta.", { currentPassword: "Palavra-passe incorreta." });
    }
    const updated = await changeOwnPassword(db, config, me.id, input.newPassword);
    // Termina as outras sessões e mantém esta.
    auth.setCookie(res, auth.sign(updated));
    res.json({ ok: true });
  });

  // ---------- Administração ----------
  const admin = express.Router();
  admin.use(auth.requireAuth);

  admin.get("/posts", (_req, res) => {
    res.json({ posts: listAdmin(db) });
  });
  admin.get("/posts/:id", (req, res) => {
    res.json({ post: getById(db, idParam(String(req.params.id))) });
  });
  admin.post("/posts", (req, res) => {
    const post = createPost(db, parse(postInput, req.body));
    res.status(201).json({ post });
  });
  admin.put("/posts/:id", (req, res) => {
    const post = updatePost(db, idParam(String(req.params.id)), parse(postInput, req.body));
    res.json({ post });
  });
  admin.delete("/posts/:id", (req, res) => {
    deletePost(db, idParam(String(req.params.id)));
    res.status(204).end();
  });
  admin.put("/featured", (req, res) => {
    const { ids } = parse(featuredInput, req.body);
    res.json({ posts: setFeatured(db, ids) });
  });

  admin.get("/content", (_req, res) => {
    res.json(adminContent(db, schema));
  });
  admin.put("/content/:key", (req, res) => {
    const me = req.user as SessionUser;
    const { value } = parse(contentInput, req.body);
    const field = setContent(db, schema, String(req.params.key), value, me.id);
    const updated = adminContent(db, schema).fields.find((f) => f.key === field.key);
    res.json({ field: updated });
  });
  admin.delete("/content/:key", (req, res) => {
    const key = String(req.params.key);
    resetContent(db, schema, key);
    const updated = adminContent(db, schema).fields.find((f) => f.key === key);
    res.json({ field: updated });
  });

  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: config.maxUploadMb * 1024 * 1024, files: 1, fields: 5, parts: 8 },
  });
  admin.get("/uploads", (_req, res) => {
    res.json({ uploads: listUploads(db) });
  });
  admin.post(
    "/uploads",
    (req: Request, res: Response, next: NextFunction) => {
      upload.single("file")(req, res, (err: unknown) => {
        if (!err) return next();
        if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
          return next(new HttpError(413, `A imagem é demasiado grande (máximo ${config.maxUploadMb} MB).`));
        }
        next(badRequest("Envio inválido."));
      });
    },
    (req, res) => {
      const me = req.user as SessionUser;
      if (!req.file) throw badRequest("Escolha uma imagem para carregar.");
      const saved = saveUpload(db, config.uploadsDir, req.file, me.id);
      if (!saved) throw badRequest("Formato não suportado. Use JPEG, PNG ou WebP.");
      res.status(201).json({ upload: saved });
    },
  );
  admin.delete("/uploads/:id", (req, res) => {
    deleteUpload(db, config.uploadsDir, idParam(String(req.params.id)));
    res.status(204).end();
  });

  const users = express.Router();
  users.use(auth.requireAdmin);
  users.get("/", (_req, res) => {
    res.json({ users: listUsers(db) });
  });
  users.post("/", async (req, res) => {
    const user = await createUser(db, config, parse(createUserInput, req.body));
    res.status(201).json({ user });
  });
  users.put("/:id", async (req, res) => {
    const me = req.user as SessionUser;
    const id = idParam(String(req.params.id));
    const input = parse(updateUserInput, req.body);
    const user = await updateUser(db, config, id, input);
    if (id === me.id) {
      const row = findByEmail(db, user.email);
      if (row) auth.setCookie(res, auth.sign(row));
    }
    res.json({ user });
  });
  users.delete("/:id", (req, res) => {
    const me = req.user as SessionUser;
    deleteUser(db, me.id, idParam(String(req.params.id)));
    res.status(204).end();
  });
  admin.use("/users", users);

  api.use("/admin", admin);
  api.use((_req, _res, next) => next(notFound("Recurso não encontrado.")));
  app.use("/api", api);

  // ---------- Sitemap dinâmico ----------
  app.get("/sitemap.xml", (_req, res) => {
    const today = new Date().toISOString().slice(0, 10);
    const entries = STATIC_PAGES.map((p) => ({
      loc: `${config.siteUrl}${p}`,
      lastmod: today,
      changefreq: p === "/" || p === "/noticias" ? "weekly" : "monthly",
      priority: p === "/" ? "1.0" : "0.8",
    }));
    for (const post of listPublished(db)) {
      entries.push({
        loc: `${config.siteUrl}/noticias/${post.slug}`,
        lastmod: post.updatedAt.slice(0, 10),
        changefreq: "monthly",
        priority: "0.7",
      });
    }
    const body = entries
      .map(
        (e) =>
          `  <url>\n    <loc>${escapeXml(e.loc)}</loc>\n    <lastmod>${e.lastmod}</lastmod>\n    <changefreq>${e.changefreq}</changefreq>\n    <priority>${e.priority}</priority>\n  </url>`,
      )
      .join("\n");
    res
      .type("application/xml; charset=utf-8")
      .send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`);
  });

  app.use((_req, res) => {
    res.status(404).json({ error: "Não encontrado." });
  });

  const onError: ErrorRequestHandler = (err, _req, res, _next) => {
    if (err instanceof HttpError) {
      res.status(err.status).json({ error: err.message, ...(err.fields ? { fields: err.fields } : {}) });
      return;
    }
    const e = err as { type?: string; status?: number };
    if (e.type === "entity.parse.failed") {
      res.status(400).json({ error: "JSON inválido." });
      return;
    }
    if (e.type === "entity.too.large") {
      res.status(413).json({ error: "O pedido é demasiado grande." });
      return;
    }
    if (typeof e.status === "number" && e.status >= 400 && e.status < 500) {
      res.status(e.status).json({ error: "Pedido inválido." });
      return;
    }
    console.error("Erro inesperado:", err);
    res.status(500).json({ error: "Erro interno do servidor." });
  };
  app.use(onError);

  return app;
}
