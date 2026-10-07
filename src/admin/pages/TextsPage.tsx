import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowCounterClockwise, ArrowDown, ArrowSquareOut, ArrowUp, Plus, X } from "@phosphor-icons/react";
import { api, ApiError } from "../../lib/api";
import { Badge, Button, Card, ErrorBox, IconButton, PageHeader, SaveBar, SectionNav, Spinner, TextArea, TextInput, inputClass, useToast, useUnsavedWarning } from "../ui";

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

  const dirtyKeys = useMemo(() => (fields ?? []).filter((f) => f.key in drafts && !eq(drafts[f.key]!, f.value)).map((f) => f.key), [fields, drafts]);
  useUnsavedWarning(dirtyKeys.length > 0);

  const navItems = useMemo(
    () => groups.map((g) => ({ id: `grupo-${g.id}`, label: g.label, flag: (fields ?? []).some((f) => f.group === g.id && dirtyKeys.includes(f.key)) })),
    [groups, fields, dirtyKeys],
  );

  if (loadError) return <ErrorBox>{loadError}</ErrorBox>;
  if (!fields) return <Spinner />;

  const current = (f: Field): Value => (f.key in drafts ? drafts[f.key]! : f.value);
  const setDraft = (f: Field, v: Value) => {
    setDrafts((d) => ({ ...d, [f.key]: v }));
    if (errors[f.key]) setErrors((e) => ({ ...e, [f.key]: "" }));
  };
  const apply = (updated: Field) => setFields((cur) => cur!.map((f) => (f.key === updated.key ? updated : f)));
  const dropDraft = (key: string) =>
    setDrafts((d) => {
      const { [key]: _gone, ...rest } = d;
      return rest;
    });

  async function saveKeys(keys: string[]) {
    setBusy(true);
    const nextErrors: Record<string, string> = {};
    let failed = 0;
    for (const key of keys) {
      const raw = drafts[key]!;
      const value = Array.isArray(raw) ? raw.map((s) => s.trim()).filter(Boolean) : raw;
      try {
        const { field } = await api<{ field: Field }>("PUT", `/admin/content/${key}`, { value });
        apply(field);
        dropDraft(key);
      } catch (e) {
        failed++;
        nextErrors[key] = e instanceof ApiError ? (e.fields?.value ?? e.message) : "Erro ao guardar.";
      }
    }
    setErrors((prev) => ({ ...prev, ...Object.fromEntries(keys.map((k) => [k, nextErrors[k] ?? ""])) }));
    setBusy(false);
    if (failed) {
      toast("error", `${failed} texto(s) não foram guardados. Veja os avisos a vermelho.`);
      const first = keys.find((k) => nextErrors[k]);
      if (first) document.getElementById(`campo-${first}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    } else toast("ok", keys.length === 1 ? "Texto guardado." : "Textos guardados.");
  }

  async function reset(f: Field) {
    try {
      const { field } = await api<{ field: Field }>("DELETE", `/admin/content/${f.key}`);
      apply(field);
      dropDraft(f.key);
      setErrors((e) => ({ ...e, [f.key]: "" }));
      toast("ok", "Texto reposto.");
    } catch (e) {
      toast("error", e instanceof ApiError ? e.message : "Não foi possível repor.");
    }
  }

  return (
    <>
      <PageHeader title="Textos do site" intro="Edite os textos de cada página. Pode sempre voltar ao texto original com «Repor original»." />
      <div className="flex gap-10">
        <div className="grid min-w-0 flex-1 gap-6">
          {groups.map((g) => {
            const gf = fields.filter((f) => f.group === g.id);
            const gDirty = gf.filter((f) => dirtyKeys.includes(f.key)).map((f) => f.key);
            return (
              <Card
                key={g.id}
                id={`grupo-${g.id}`}
                title={g.label}
                actions={
                  <>
                    <a href={g.path} target="_blank" rel="noopener noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[13px] text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900">
                      Ver página <ArrowSquareOut size={14} aria-hidden />
                    </a>
                    <Button small onClick={() => void saveKeys(gDirty)} disabled={gDirty.length === 0 || busy}>
                      Guardar{gDirty.length ? ` (${gDirty.length})` : ""}
                    </Button>
                  </>
                }
              >
                <div className="grid gap-8">
                  {gf.map((f) => (
                    <FieldEditor
                      key={f.key}
                      field={f}
                      value={current(f)}
                      error={errors[f.key]}
                      dirty={dirtyKeys.includes(f.key)}
                      onChange={(v) => setDraft(f, v)}
                      onReset={() => (f.modified ? void reset(f) : setDraft(f, f.default))}
                    />
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
        <SectionNav items={navItems} />
      </div>
      <SaveBar
        visible={dirtyKeys.length > 0}
        busy={busy}
        label={dirtyKeys.length === 1 ? "1 texto por guardar." : `${dirtyKeys.length} textos por guardar.`}
        onSave={() => void saveKeys(dirtyKeys)}
        onDiscard={() => {
          setDrafts({});
          setErrors({});
        }}
      />
    </>
  );
}

function FieldEditor({
  field: f,
  value: v,
  error,
  dirty,
  onChange,
  onReset,
}: {
  field: Field;
  value: Value;
  error?: string;
  dirty: boolean;
  onChange: (v: Value) => void;
  onReset: () => void;
}) {
  const canReset = f.modified || !eq(v, f.default);
  return (
    <div id={`campo-${f.key}`} className="grid scroll-mt-28 gap-2">
      {dirty || f.modified || canReset ? (
        <div className="flex flex-wrap items-center gap-2">
          {dirty ? <Badge tone="blue">Por guardar</Badge> : f.modified ? <Badge tone="amber">Personalizado</Badge> : null}
          {canReset ? (
            <button type="button" onClick={onReset} className="ml-auto inline-flex items-center gap-1 text-[13px] text-zinc-500 hover:text-zinc-900">
              <ArrowCounterClockwise size={14} aria-hidden /> Repor original
            </button>
          ) : null}
        </div>
      ) : null}
      {f.type === "text" ? <TextInput label={f.label} help={f.help} error={error} value={v as string} maxLength={f.max} showCount onChange={(e) => onChange(e.target.value)} /> : null}
      {f.type === "textarea" ? <TextArea label={f.label} help={f.help} error={error} value={v as string} maxLength={f.max} showCount rows={4} onChange={(e) => onChange(e.target.value)} /> : null}
      {f.type === "paragraphs" || f.type === "list" ? <ListEditor field={f} value={v as string[]} error={error} multiline={f.type === "paragraphs"} onChange={onChange} /> : null}
    </div>
  );
}

function ListEditor({ field, value, error, multiline, onChange }: { field: Field; value: string[]; error?: string; multiline?: boolean; onChange: (v: string[]) => void }) {
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
    <fieldset className="grid gap-2.5">
      <legend className="mb-1.5 flex w-full items-baseline justify-between text-sm text-zinc-500">
        <span>{field.label}</span>
        <span className="text-xs text-zinc-400 tabular-nums">
          {value.length} / {max}
        </span>
      </legend>
      {value.map((item, i) => (
        <div key={i} className="flex items-start gap-2">
          <span className="mt-3 w-5 shrink-0 text-right text-[13px] text-zinc-400 tabular-nums">{i + 1}</span>
          {multiline ? (
            <textarea aria-label={`${field.label}, item ${i + 1}`} value={item} rows={5} maxLength={field.max} onChange={(e) => update(i, e.target.value)} className={`${inputClass} h-auto min-w-0 flex-1 py-2.5 leading-relaxed`} />
          ) : (
            <input aria-label={`${field.label}, item ${i + 1}`} value={item} maxLength={field.max} onChange={(e) => update(i, e.target.value)} className={`${inputClass} min-w-0 flex-1`} />
          )}
          <div className={`flex shrink-0 ${multiline ? "flex-col" : ""} pt-1.5`}>
            <IconButton label={`Subir item ${i + 1}`} disabled={i === 0} onClick={() => move(i, -1)}>
              <ArrowUp size={16} aria-hidden />
            </IconButton>
            <IconButton label={`Descer item ${i + 1}`} disabled={i === value.length - 1} onClick={() => move(i, 1)}>
              <ArrowDown size={16} aria-hidden />
            </IconButton>
            <IconButton label={`Remover item ${i + 1}`} onClick={() => onChange(value.filter((_, idx) => idx !== i))} className="hover:!bg-red-50 hover:!text-red-600">
              <X size={16} aria-hidden />
            </IconButton>
          </div>
        </div>
      ))}
      <div className="pl-7">
        <Button tone="secondary" small disabled={value.length >= max} onClick={() => onChange([...value, ""])}>
          <Plus size={14} weight="bold" aria-hidden /> Adicionar {multiline ? "parágrafo" : "item"}
        </Button>
      </div>
      {error ? (
        <p role="alert" className="pl-7 text-[13px] text-red-600">
          {error}
        </p>
      ) : field.help ? (
        <p className="pl-7 text-[13px] text-zinc-500">{field.help}</p>
      ) : null}
    </fieldset>
  );
}
