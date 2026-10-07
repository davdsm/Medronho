import { z } from "zod";
import type { Db } from "./db.js";
import { nowIso, transaction } from "./db.js";
import { badRequest, conflict, notFound } from "./errors.js";
import { cleanText, isRealDate } from "./validation.js";

export const IMAGE_PATH = /^\/(photos|uploads)\/[A-Za-z0-9._-]+$/;

const text = (min: number, max: number, multiline = false) =>
  z
    .string()
    .transform((v) => cleanText(v, multiline))
    .pipe(z.string().min(min).max(max));

export const postInput = z
  .object({
    title: text(3, 160),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .max(80)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "use apenas letras minúsculas, números e hífens")
      .optional(),
    excerpt: text(3, 300),
    body: z.array(text(1, 5000, true)).min(1).max(40),
    image: z.string().regex(IMAGE_PATH, "escolha uma imagem do site ou carregue uma nova"),
    imageAlt: text(3, 200),
    author: text(2, 100),
    category: text(0, 100).default(""),
    publishedAt: z.string().refine(isRealDate, "data inválida (use AAAA-MM-DD)"),
    status: z.enum(["draft", "published"]),
    featured: z.boolean().default(false),
  })
  .strict();

export type PostInput = z.infer<typeof postInput>;

type Row = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  image: string;
  image_alt: string;
  author: string;
  category: string;
  published_at: string;
  status: "draft" | "published";
  featured: number;
  featured_order: number;
  created_at: string;
  updated_at: string;
};

export type Post = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  body: string[];
  image: string;
  imageAlt: string;
  author: string;
  category: string;
  publishedAt: string;
  status: "draft" | "published";
  featured: boolean;
  featuredOrder: number;
  createdAt: string;
  updatedAt: string;
};

function toPost(row: Row): Post {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    body: JSON.parse(row.body) as string[],
    image: row.image,
    imageAlt: row.image_alt,
    author: row.author,
    category: row.category,
    publishedAt: row.published_at,
    status: row.status,
    featured: row.featured === 1,
    featuredOrder: row.featured_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Versão pública (sem estado interno). */
export function toPublic(post: Post) {
  const { id: _id, status: _s, featured: _f, featuredOrder: _o, createdAt: _c, ...rest } = post;
  return rest;
}

export function slugify(input: string): string {
  const base = input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
  return base || "noticia";
}

function uniqueSlug(db: Db, wanted: string, ignoreId?: number): string {
  let candidate = wanted;
  for (let n = 2; ; n += 1) {
    const hit = db.prepare("SELECT id FROM posts WHERE slug = ?").get(candidate) as { id: number } | undefined;
    if (!hit || hit.id === ignoreId) return candidate;
    const suffix = `-${n}`;
    candidate = `${wanted.slice(0, 80 - suffix.length)}${suffix}`;
  }
}

const SELECT = "SELECT * FROM posts";

export function listAdmin(db: Db): Post[] {
  return (db.prepare(`${SELECT} ORDER BY published_at DESC, id DESC`).all() as Row[]).map(toPost);
}

export function listPublished(db: Db): Post[] {
  return (
    db.prepare(`${SELECT} WHERE status = 'published' ORDER BY published_at DESC, id DESC`).all() as Row[]
  ).map(toPost);
}

export function listFeatured(db: Db): Post[] {
  return (
    db
      .prepare(
        `${SELECT} WHERE status = 'published' AND featured = 1 ORDER BY featured_order ASC, published_at DESC, id DESC`,
      )
      .all() as Row[]
  ).map(toPost);
}

export function getById(db: Db, id: number): Post {
  const row = db.prepare(`${SELECT} WHERE id = ?`).get(id) as Row | undefined;
  if (!row) throw notFound("Notícia não encontrada.");
  return toPost(row);
}

export function getPublishedBySlug(db: Db, slug: string): Post | null {
  const row = db.prepare(`${SELECT} WHERE slug = ? AND status = 'published'`).get(slug) as Row | undefined;
  return row ? toPost(row) : null;
}

function nextFeaturedOrder(db: Db): number {
  const row = db.prepare("SELECT COALESCE(MAX(featured_order), -1) + 1 AS n FROM posts WHERE featured = 1").get() as {
    n: number;
  };
  return row.n;
}

export function createPost(db: Db, input: PostInput): Post {
  return transaction(db, () => {
    const slug = uniqueSlug(db, input.slug ?? slugify(input.title));
    if (input.slug && slug !== input.slug) throw conflict("Já existe uma notícia com este endereço (slug).");
    const featured = input.featured && input.status === "published";
    const now = nowIso();
    const result = db
      .prepare(
        `INSERT INTO posts (slug, title, excerpt, body, image, image_alt, author, category, published_at, status, featured, featured_order, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        slug,
        input.title,
        input.excerpt,
        JSON.stringify(input.body),
        input.image,
        input.imageAlt,
        input.author,
        input.category,
        input.publishedAt,
        input.status,
        featured ? 1 : 0,
        featured ? nextFeaturedOrder(db) : 0,
        now,
        now,
      );
    return getById(db, Number(result.lastInsertRowid));
  });
}

export function updatePost(db: Db, id: number, input: PostInput): Post {
  return transaction(db, () => {
    const current = getById(db, id);
    let slug = current.slug;
    if (input.slug && input.slug !== current.slug) {
      slug = uniqueSlug(db, input.slug, id);
      if (slug !== input.slug) throw conflict("Já existe uma notícia com este endereço (slug).");
    }
    const featured = input.featured && input.status === "published";
    const order = featured ? (current.featured ? current.featuredOrder : nextFeaturedOrder(db)) : 0;
    db.prepare(
      `UPDATE posts SET slug = ?, title = ?, excerpt = ?, body = ?, image = ?, image_alt = ?, author = ?, category = ?,
         published_at = ?, status = ?, featured = ?, featured_order = ?, updated_at = ? WHERE id = ?`,
    ).run(
      slug,
      input.title,
      input.excerpt,
      JSON.stringify(input.body),
      input.image,
      input.imageAlt,
      input.author,
      input.category,
      input.publishedAt,
      input.status,
      featured ? 1 : 0,
      order,
      nowIso(),
      id,
    );
    return getById(db, id);
  });
}

export function deletePost(db: Db, id: number) {
  getById(db, id);
  db.prepare("DELETE FROM posts WHERE id = ?").run(id);
}

/** Define exatamente quais as notícias em destaque na página inicial, e a ordem. */
export function setFeatured(db: Db, ids: number[]): Post[] {
  if (new Set(ids).size !== ids.length) throw badRequest("Há notícias repetidas na lista.");
  return transaction(db, () => {
    for (const id of ids) {
      const post = getById(db, id);
      if (post.status !== "published") {
        throw badRequest(`A notícia «${post.title}» é um rascunho e não pode estar na página inicial.`);
      }
    }
    db.prepare("UPDATE posts SET featured = 0, featured_order = 0").run();
    const update = db.prepare("UPDATE posts SET featured = 1, featured_order = ?, updated_at = ? WHERE id = ?");
    ids.forEach((id, index) => update.run(index, nowIso(), id));
    return listFeatured(db);
  });
}

export function countImageUsage(db: Db, imagePath: string): number {
  const row = db.prepare("SELECT COUNT(*) AS n FROM posts WHERE image = ?").get(imagePath) as { n: number };
  return row.n;
}
