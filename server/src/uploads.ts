import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { Db } from "./db.js";
import { nowIso } from "./db.js";
import { conflict, notFound } from "./errors.js";
import { countImageUsage } from "./posts.js";

export type UploadKind = { mime: string; ext: string };

/** Identifica o tipo real pelo conteúdo (nunca confiar no nome nem no Content-Type do cliente). */
export function sniffImage(buf: Buffer): UploadKind | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return { mime: "image/jpeg", ext: "jpg" };
  }
  if (
    buf.length >= 8 &&
    buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return { mime: "image/png", ext: "png" };
  }
  if (buf.length >= 12 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") {
    return { mime: "image/webp", ext: "webp" };
  }
  return null;
}

export type UploadRow = {
  id: number;
  filename: string;
  original_name: string;
  mime: string;
  size: number;
  created_at: string;
  created_by: number | null;
};

export const toUpload = (db: Db, row: UploadRow) => ({
  id: row.id,
  url: `/uploads/${row.filename}`,
  originalName: row.original_name,
  mime: row.mime,
  size: row.size,
  createdAt: row.created_at,
  usedBy: countImageUsage(db, `/uploads/${row.filename}`),
});

function safeOriginalName(name: string): string {
  const base = path.basename(name).normalize("NFC");
  // eslint-disable-next-line no-control-regex
  return base.replace(/[\u0000-\u001F\u007F<>:"/\\|?*]/g, "_").slice(0, 120) || "imagem";
}

export function saveUpload(
  db: Db,
  uploadsDir: string,
  file: { buffer: Buffer; originalname: string },
  userId: number,
) {
  const kind = sniffImage(file.buffer);
  if (!kind) return null;
  fs.mkdirSync(uploadsDir, { recursive: true });
  const filename = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${kind.ext}`;
  fs.writeFileSync(path.join(uploadsDir, filename), file.buffer, { flag: "wx", mode: 0o644 });
  const result = db
    .prepare(
      "INSERT INTO uploads (filename, original_name, mime, size, created_at, created_by) VALUES (?, ?, ?, ?, ?, ?)",
    )
    .run(filename, safeOriginalName(file.originalname), kind.mime, file.buffer.length, nowIso(), userId);
  const row = db.prepare("SELECT * FROM uploads WHERE id = ?").get(Number(result.lastInsertRowid)) as UploadRow;
  return toUpload(db, row);
}

export function listUploads(db: Db) {
  const rows = db.prepare("SELECT * FROM uploads ORDER BY id DESC").all() as UploadRow[];
  return rows.map((row) => toUpload(db, row));
}

export function deleteUpload(db: Db, uploadsDir: string, id: number) {
  const row = db.prepare("SELECT * FROM uploads WHERE id = ?").get(id) as UploadRow | undefined;
  if (!row) throw notFound("Imagem não encontrada.");
  const used = countImageUsage(db, `/uploads/${row.filename}`);
  if (used > 0) {
    throw conflict(`Esta imagem está a ser usada em ${used} notícia${used === 1 ? "" : "s"}.`);
  }
  db.prepare("DELETE FROM uploads WHERE id = ?").run(id);
  fs.rmSync(path.join(uploadsDir, row.filename), { force: true });
}
