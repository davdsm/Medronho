import { useCallback, useEffect, useMemo, useState } from "react";
import { api, ApiError } from "../../lib/api";
import { Badge, Button, Card, ErrorBox, PageHeader, Spinner, TextArea, TextInput, useToast, useUnsavedWarning } from "../ui";

type Value = string | string[];
type Field = {
  key: string;
  group: string;
  label: string;
  type: "text" | "textarea" | "list" | "paragraphs";
  default: Value;
  value: Value;
  modified: boolean;
  help?: string;
  max: number;
  maxItems?: number;
};
type Group = { id: string; label: string; path: string };

const eq = (a: Value, b: Value) => JSON.stringify(a) === JSON.stringify(b);

export function TextsPage() {
  const toast = useToast();
  const [groups, setGroups] = useState<Group[]>([]);
  const [fields, setFields] = useState<Field[] | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Value>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [active, setActive] = useState<string>("home");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api<{ groups: Group[]; fields: Field[] }>("GET", "/admin/content")
      .then((r) => {
        setGroups(r.groups);
        setFields(r.fields);
        setDrafts({});
      })
      .catch((e: unknown) => setLoadError(e instanceof ApiError ? e.message : "Erro ao carregar."));
  }, []);
  useEffect(load, [load]);

  const dirtyKeys = useMemo(
    () => (fields ?? []).filter((f) => f.key in drafts && !eq(drafts[f.key]!, f.value)).map((f) => f.key),
    [fields, drafts],
  );
  useUnsavedWarning(dirtyKeys.length > 0);

  if (loadError) return <ErrorBox>{loadError}</ErrorBox>;
  if (!fields) return <Spinner />;

  const group = groups.find((g) => g.id === active) ?? groups[0]!;
  const groupFields = fields.filter((f) => f.group === group.id);
  const groupDirty = groupFields.filter((f) => dirtyKeys.includes(f.key));

  const current = (f: Field): Value => (f.key in drafts ? drafts[f.key]! : f.value);
  const setDraft = (f: Field, v: Value) => {
    setDrafts({ ...drafts, [f.key]: v });
    if (errors[f.key]) setErrors({ ...errors, [f.key]: "" });
  };

  const apply = (updated: Field) => setFields((cur) => cur!.map((f) => (f.key === updated.key ? updated : f)));

  async function saveGroup() {
    setBusy(true);
    const nextErrors = { ...errors };
    let failed = 0;
    for (const f of groupDirty) {
      const raw = drafts[f.key]!;
      const value = Array.isArray(raw) ? raw.map((s) => s.trim()).filter(Boolean) : raw;
      try {
        const { field } = await api<{ field: Field }>("PUT", `/admin/content/${f.key}`, { value });
        apply(field);
        setDrafts((d) => {
          const { [f.key]: _gone, ...rest } = d;
          return rest;
        });
        nextErrors[f.key] = "";
      } catch (e) {
        failed++;
        nextErrors[f.key] = e instanceof ApiError ? e.message : "Erro ao guardar.";
      }
    }
    setErrors(nextErrors);
    setBusy(false);
    if (failed) toast("error", `${failed} campo(s) não foram guardados. Veja os avisos a vermelho.`);
    else toast("ok", "Textos guardados.");
  }

  async function reset(f: Field) {
    try {
      const { field } = await api<{ field: Field }>("DELETE", `/admin/content/${f.key}`);
      apply(field);
      setDrafts((d) => {
        const { [f.key]: _gone, ...rest } = d;
        return rest;
      });
      setErrors({ ...errors, [f.key]: "" });
      toast("ok", "Texto reposto.");
    } catch (e) {
      toast("error", e instanceof ApiError ? e.message : "Não foi possível repor.");
    }
  }

  return (
    <>
      <PageHeader
        title="Textos do site"
        intro="Edite os textos das páginas. «Repor original» volta ao texto que o site tinha de origem."
        actions={
          <>
            <a href={group.path} target="_blank" rel="noopener noreferrer">
              <Button tone="secondary">Ver página ↗</Button>
            </a>
            <Button onClick={() => void saveGroup()} disabled={groupDirty.length === 0 || busy}>
              {busy ? "A guardar…" : `Guardar${groupDirty.length ? ` (${groupDirty.length})` : ""}`}
            </Button>
          </>
        }
      />
      <div role="tablist" aria-label="Secções" className="mb-6 flex flex-wrap gap-1">
        {groups.map((g) => {
          const n = fields.filter((f) => f.group === g.id && dirtyKeys.includes(f.key)).length;
          return (
            <button
              key={g.id}
              role="tab"
              type="button"
              aria-selected={g.id === group.id}
              onClick={() => setActive(g.id)}
              className={`rounded-lg px-3.5 py-2 text-[15px] font-semibold ${g.id === group.id ? "bg-wine text-foam" : "bg-white text-ink ring-1 ring-ink/15 hover:bg-butter/40"}`}
            >
              {g.label}
              {n ? <span className="ml-2 rounded-full bg-butter px-1.5 text-xs text-ink">{n}</span> : null}
            </button>
          );
        })}
      </div>
      <div className="grid gap-5" role="tabpanel">
        {groupFields.map((f) => {
          const v = current(f);
          const err = errors[f.key];
          return (
            <Card key={f.key} className="grid gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {f.modified ? <Badge tone="yellow">Personalizado</Badge> : <Badge tone="gray">Original</Badge>}
                {f.key in drafts && dirtyKeys.includes(f.key) ? <Badge tone="red">Por guardar</Badge> : null}
                <span className="ml-auto" />
                {f.modified || (f.key in drafts && !eq(drafts[f.key]!, f.default)) ? (
                  <Button tone="ghost" small onClick={() => (f.modified ? void reset(f) : setDraft(f, f.default))}>
                    Repor original
                  </Button>
                ) : null}
              </div>
              {f.type === "text" ? (
                <TextInput label={f.label} help={f.help} error={err} value={v as string} maxLength={f.max} onChange={(e) => setDraft(f, e.target.value)} />
              ) : null}
              {f.type === "textarea" ? (
                <TextArea label={f.label} help={f.help} error={err} value={v as string} maxLength={f.max} rows={4} onChange={(e) => setDraft(f, e.target.value)} />
              ) : null}
              {f.type === "paragraphs" ? (
                <ListEditor field={f} value={v as string[]} error={err} multiline onChange={(x) => setDraft(f, x)} />
              ) : null}
              {f.type === "list" ? <ListEditor field={f} value={v as string[]} error={err} onChange={(x) => setDraft(f, x)} /> : null}
            </Card>
          );
        })}
      </div>
    </>
  );
}

function ListEditor({
  field,
  value,
  error,
  multiline,
  onChange,
}: {
  field: Field;
  value: string[];
  error?: string;
  multiline?: boolean;
  onChange: (v: string[]) => void;
}) {
  const max = field.maxItems ?? 20;
  const update = (i: number, text: string) => onChange(value.map((x, idx) => (idx === i ? text : x)));
  const move = (i: number, d: -1 | 1) => {
    const next = [...value];
    const t = i + d;
    if (t < 0 || t >= next.length) return;
    [next[i], next[t]] = [next[t]!, next[i]!];
    onChange(next);
  };
  return (
    <fieldset className="grid gap-3">
      <legend className="text-sm font-semibold text-ink">{field.label}</legend>
      {field.help ? <p className="-mt-1 text-[13px] text-ink-soft">{field.help}</p> : null}
      {value.map((item, i) => (
        <div key={i} className="flex items-start gap-2">
          <span className="mt-2.5 w-5 shrink-0 text-right text-sm font-semibold text-ink-soft">{i + 1}.</span>
          {multiline ? (
            <textarea
              aria-label={`${field.label}, item ${i + 1}`}
              value={item}
              rows={5}
              maxLength={field.max}
              onChange={(e) => update(i, e.target.value)}
              className="min-w-0 flex-1 rounded-lg border border-ink/20 bg-white px-3 py-2.5 text-[15px] leading-relaxed focus:border-wine focus:outline-none focus:ring-2 focus:ring-wine/20"
            />
          ) : (
            <input
              aria-label={`${field.label}, item ${i + 1}`}
              value={item}
              maxLength={field.max}
              onChange={(e) => update(i, e.target.value)}
              className="min-w-0 flex-1 rounded-lg border border-ink/20 bg-white px-3 py-2.5 text-[15px] focus:border-wine focus:outline-none focus:ring-2 focus:ring-wine/20"
            />
          )}
          <div className="flex shrink-0 flex-col gap-1 sm:flex-row">
            <Button tone="secondary" small aria-label="Subir" disabled={i === 0} onClick={() => move(i, -1)}>
              ↑
            </Button>
            <Button tone="secondary" small aria-label="Descer" disabled={i === value.length - 1} onClick={() => move(i, 1)}>
              ↓
            </Button>
            <Button tone="ghost" small className="!text-berry" aria-label="Remover" onClick={() => onChange(value.filter((_, idx) => idx !== i))}>
              ✕
            </Button>
          </div>
        </div>
      ))}
      <div>
        <Button tone="secondary" small disabled={value.length >= max} onClick={() => onChange([...value, ""])}>
          + Adicionar
        </Button>
        <span className="ml-3 text-[13px] text-ink-soft">
          {value.length} / {max}
        </span>
      </div>
      {error ? (
        <p role="alert" className="text-[13px] font-medium text-berry">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
