import fs from "node:fs";
import path from "node:path";
import type { Db } from "./db.js";
import { nowIso } from "./db.js";
import { badRequest, notFound } from "./errors.js";
import { cleanText } from "./validation.js";

export type FieldType = "text" | "textarea" | "list" | "paragraphs";
export type FieldValue = string | string[];

export type Field = {
  key: string;
  group: string;
  label: string;
  type: FieldType;
  default: FieldValue;
  help?: string;
  /** Texto: comprimento máximo. Listas: comprimento máximo de cada item. */
  max: number;
  maxItems?: number;
};

export type Group = { id: string; label: string; path: string };
export type ContentSchema = { groups: Group[]; fields: Field[]; byKey: Map<string, Field> };

export function loadContentSchema(sharedDir: string): ContentSchema {
  const raw = JSON.parse(fs.readFileSync(path.join(sharedDir, "content.defaults.json"), "utf8")) as {
    groups: Group[];
    fields: Field[];
  };
  const byKey = new Map(raw.fields.map((f) => [f.key, f]));
  if (byKey.size !== raw.fields.length) throw new Error("content.defaults.json tem chaves repetidas.");
  return { groups: raw.groups, fields: raw.fields, byKey };
}

function same(a: FieldValue, b: FieldValue) {
  return JSON.stringify(a) === JSON.stringify(b);
}

/** Valida e normaliza o valor de um campo editável. */
export function validateFieldValue(field: Field, value: unknown): FieldValue {
  const fail = (msg: string) => badRequest(`${field.label}: ${msg}`, { value: msg });
  if (field.type === "text" || field.type === "textarea") {
    if (typeof value !== "string") throw fail("tem de ser texto.");
    const v = cleanText(value, field.type === "textarea");
    if (v.length === 0) throw fail("não pode ficar vazio.");
    if (v.length > field.max) throw fail(`é demasiado longo (máximo ${field.max} caracteres).`);
    return v;
  }
  if (!Array.isArray(value)) throw fail("tem de ser uma lista.");
  const maxItems = field.maxItems ?? 20;
  if (value.length === 0) throw fail("tem de ter pelo menos um item.");
  if (value.length > maxItems) throw fail(`tem demasiados itens (máximo ${maxItems}).`);
  return value.map((item, i) => {
    if (typeof item !== "string") throw fail(`o item ${i + 1} tem de ser texto.`);
    const v = cleanText(item, field.type === "paragraphs");
    if (v.length === 0) throw fail(`o item ${i + 1} não pode ficar vazio.`);
    if (v.length > field.max) throw fail(`o item ${i + 1} é demasiado longo (máximo ${field.max} caracteres).`);
    return v;
  });
}

type Row = { key: string; value: string; updated_at: string };

function overrides(db: Db): Map<string, Row> {
  const rows = db.prepare("SELECT key, value, updated_at FROM content").all() as Row[];
  return new Map(rows.map((r) => [r.key, r]));
}

/** Mapa público chave → valor (predefinição ou valor editado). */
export function publicContent(db: Db, schema: ContentSchema): Record<string, FieldValue> {
  const stored = overrides(db);
  const out: Record<string, FieldValue> = {};
  for (const field of schema.fields) {
    const row = stored.get(field.key);
    let value: FieldValue = field.default;
    if (row) {
      try {
        value = validateFieldValue(field, JSON.parse(row.value));
      } catch {
        value = field.default;
      }
    }
    out[field.key] = value;
  }
  return out;
}

export function adminContent(db: Db, schema: ContentSchema) {
  const stored = overrides(db);
  const values = publicContent(db, schema);
  return {
    groups: schema.groups,
    fields: schema.fields.map((field) => {
      const row = stored.get(field.key);
      return {
        ...field,
        value: values[field.key]!,
        modified: Boolean(row),
        updatedAt: row?.updated_at ?? null,
      };
    }),
  };
}

export function setContent(db: Db, schema: ContentSchema, key: string, value: unknown, userId: number) {
  const field = schema.byKey.get(key);
  if (!field) throw notFound("Campo de texto desconhecido.");
  const clean = validateFieldValue(field, value);
  if (same(clean, field.default)) {
    db.prepare("DELETE FROM content WHERE key = ?").run(key);
  } else {
    db.prepare(
      `INSERT INTO content (key, value, updated_at, updated_by) VALUES (?, ?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at, updated_by = excluded.updated_by`,
    ).run(key, JSON.stringify(clean), nowIso(), userId);
  }
  return field;
}

export function resetContent(db: Db, schema: ContentSchema, key: string) {
  if (!schema.byKey.has(key)) throw notFound("Campo de texto desconhecido.");
  db.prepare("DELETE FROM content WHERE key = ?").run(key);
}
