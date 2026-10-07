import { z } from "zod";
import { badRequest } from "./errors.js";

z.config(z.locales.pt());

/** Valida `data` com `schema`; em caso de erro devolve 400 com o detalhe por campo. */
export function parse<T extends z.ZodType>(schema: T, data: unknown): z.infer<T> {
  const result = schema.safeParse(data);
  if (result.success) return result.data;
  const fields: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.length ? issue.path.join(".") : "_";
    if (!(key in fields)) fields[key] = issue.message;
  }
  const first = Object.entries(fields)[0];
  const summary = first ? (first[0] === "_" ? first[1] : `${first[0]}: ${first[1]}`) : "Dados inválidos.";
  throw badRequest(`Dados inválidos. ${summary}`, fields);
}

export function isRealDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

/** Normaliza um valor para texto simples sem caracteres de controlo (exceto \n quando permitido). */
export function cleanText(value: string, allowNewlines: boolean): string {
  let v = value.replace(/\r\n?/g, "\n");
  // eslint-disable-next-line no-control-regex
  v = v.replace(allowNewlines ? /[\u0000-\u0009\u000B-\u001F\u007F]/g : /[\u0000-\u001F\u007F]/g, " ");
  return v.trim();
}
