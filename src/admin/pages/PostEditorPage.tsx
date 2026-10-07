import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ArrowLeft, ArrowSquareOut, Trash } from "@phosphor-icons/react";
import { api, ApiError } from "../../lib/api";
import { formatDate } from "../../lib/types";
import { ImagePicker } from "../ImagePicker";
import { useStats } from "../stats";
import { Badge, Button, Card, ConfirmDialog, ErrorBox, PageHeader, SaveBar, SectionNav, Spinner, TextArea, TextInput, useToast, useUnsavedWarning } from "../ui";
import type { AdminPost } from "./PostsPage";

type Form = {
  title: string;
  slug: string;
  excerpt: string;
  body: string; // parágrafos separados por linha em branco
  image: string;
  imageAlt: string;
  author: string;
  category: string;
  publishedAt: string;
  status: "draft" | "published";
  featured: boolean;
};

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const empty = (): Form => ({
  title: "",
  slug: "",
  excerpt: "",
  body: "",
  image: "",
  imageAlt: "",
  author: "",
  category: "",
  publishedAt: today(),
  status: "draft",
  featured: false,
});

const fromPost = (p: AdminPost): Form => ({
  title: p.title,
  slug: p.slug,
  excerpt: p.excerpt,
  body: p.body.join("\n\n"),
  image: p.image,
  imageAlt: p.imageAlt,
  author: p.author,
  category: p.category,
  publishedAt: p.publishedAt,
  status: p.status,
  featured: p.featured,
});

/** Erros do servidor para o corpo vêm como «body.3»; junta-os no campo «body». */
function normalizeErrors(fields: Record<string, string> | undefined) {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(fields ?? {})) {
    const m = /^body\.(\d+)$/.exec(k);
    if (m) out.body = `Parágrafo ${Number(m[1]) + 1}: ${v}`;
    else out[k] = v;
  }
  return out;
}

export function PostEditorPage() {
  const { id } = useParams();
  const isNew = id === undefined;
  const navigate = useNavigate();
  const toast = useToast();
  const { refresh } = useStats();
  const [form, setForm] = useState<Form | null>(isNew ? empty() : null);
  const [initial, setInitial] = useState<string>(isNew ? JSON.stringify(empty()) : "");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saved, setSaved] = useState<AdminPost | null>(null);

  useEffect(() => {
    if (isNew) return;
    setForm(null);
    api<{ post: AdminPost }>("GET", `/admin/posts/${id}`)
      .then(({ post }) => {
        const f = fromPost(post);
        setForm(f);
        setInitial(JSON.stringify(f));
        setSaved(post);
      })
      .catch((e: unknown) => setLoadError(e instanceof ApiError ? e.message : "Erro ao carregar."));
  }, [id, isNew]);

  const dirty = form !== null && JSON.stringify(form) !== initial;
  useUnsavedWarning(dirty);

  const sections = useMemo(
    () => [
      { id: "conteudo", label: "Conteúdo", flag: !!(errors.title || errors.excerpt || errors.body) },
      { id: "imagem", label: "Imagem", flag: !!(errors.image || errors.imageAlt) },
      { id: "publicacao", label: "Publicação", flag: !!(errors.publishedAt || errors.status) },
      { id: "detalhes", label: "Autor e endereço", flag: !!(errors.author || errors.slug || errors.category) },
    ],
    [errors],
  );

  if (loadError) {
    return (
      <div className="grid max-w-xl gap-4">
        <ErrorBox>{loadError}</ErrorBox>
        <Link to="/admin/noticias" className="text-sm text-blue-600 hover:underline">
          ← Voltar às notícias
        </Link>
      </div>
    );
  }
  if (!form) return <Spinner />;

  const set = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm({ ...form, [key]: value });
    if (errors[key]) setErrors({ ...errors, [key]: "" });
  };

  async function save(e?: FormEvent) {
    e?.preventDefault();
    if (!form) return;
    setBusy(true);
    setErrors({});
    setFormError(null);
    const paragraphs = form.body
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean);
    const local: Record<string, string> = {};
    if (!form.image) local.image = "Escolha uma imagem.";
    if (!paragraphs.length) local.body = "Escreva o texto da notícia.";
    const payload = {
      title: form.title,
      ...(form.slug.trim() ? { slug: form.slug.trim() } : {}),
      excerpt: form.excerpt,
      body: paragraphs,
      image: form.image,
      imageAlt: form.imageAlt,
      author: form.author,
      category: form.category,
      publishedAt: form.publishedAt,
      status: form.status,
      featured: form.status === "published" && form.featured,
    };
    try {
      if (Object.keys(local).length) throw new ApiError(400, "Há campos por preencher.", local);
      const res = isNew
        ? await api<{ post: AdminPost }>("POST", "/admin/posts", payload)
        : await api<{ post: AdminPost }>("PUT", `/admin/posts/${id}`, payload);
      toast("ok", isNew ? "Notícia criada." : "Alterações guardadas.");
      const f = fromPost(res.post);
      setForm(f);
      setInitial(JSON.stringify(f));
      setSaved(res.post);
      refresh();
      if (isNew) navigate(`/admin/noticias/${res.post.id}`, { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        const fields = normalizeErrors(err.fields);
        setErrors(fields);
        setFormError(Object.keys(fields).length ? "Corrija os campos assinalados." : err.message);
        const firstKey = Object.keys(fields)[0];
        const section = sections.find((s) =>
          ({ conteudo: ["title", "excerpt", "body"], imagem: ["image", "imageAlt"], publicacao: ["publishedAt", "status"], detalhes: ["author", "slug", "category"] })[s.id]?.includes(firstKey ?? ""),
        );
        document.getElementById(section?.id ?? "conteudo")?.scrollIntoView({ behavior: "smooth", block: "start" });
      } else setFormError("Erro inesperado.");
    } finally {
      setBusy(false);
    }
  }

  function discard() {
    setForm(JSON.parse(initial) as Form);
    setErrors({});
    setFormError(null);
  }

  async function doDelete() {
    setBusy(true);
    try {
      await api("DELETE", `/admin/posts/${id}`);
      toast("ok", "Notícia apagada.");
      setInitial(JSON.stringify(form));
      refresh();
      navigate("/admin/noticias");
    } catch (err) {
      toast("error", err instanceof ApiError ? err.message : "Não foi possível apagar.");
      setConfirmDelete(false);
    } finally {
      setBusy(false);
    }
  }

  const twoCols = "grid gap-x-8 gap-y-6 md:grid-cols-2";

  return (
    <form onSubmit={save} noValidate>
      <Link to="/admin/noticias" className="mb-4 inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900">
        <ArrowLeft size={16} aria-hidden /> Notícias
      </Link>
      <PageHeader
        title={isNew ? "Nova notícia" : saved?.title || "Editar notícia"}
        actions={
          <>
            {saved ? (
              <Badge tone={saved.status === "published" ? "green" : "gray"} dot>
                {saved.status === "published" ? "Publicada" : "Rascunho"}
              </Badge>
            ) : (
              <Badge tone="blue">Nova</Badge>
            )}
            {saved?.status === "published" ? (
              <a href={`/noticias/${saved.slug}`} target="_blank" rel="noopener noreferrer">
                <Button tone="secondary" small>
                  <ArrowSquareOut size={16} aria-hidden /> Ver no site
                </Button>
              </a>
            ) : null}
            {!isNew ? (
              <Button tone="secondary" small onClick={() => setConfirmDelete(true)} disabled={busy} className="!text-red-600">
                <Trash size={16} aria-hidden /> Apagar
              </Button>
            ) : null}
          </>
        }
        meta={saved ? <>Atualizada: {formatDate(saved.updatedAt.slice(0, 10))}</> : null}
      />

      <div className="flex gap-10">
        <div className="grid min-w-0 flex-1 gap-6">
          {formError ? <ErrorBox>{formError}</ErrorBox> : null}

          <Card id="conteudo" title="Conteúdo">
            <div className="grid gap-6">
              <TextInput label="Título" value={form.title} onChange={(e) => set("title", e.target.value)} error={errors.title} maxLength={160} showCount required />
              <TextArea
                label="Resumo"
                help="Aparece nas listas de notícias e no carrossel da página inicial."
                value={form.excerpt}
                onChange={(e) => set("excerpt", e.target.value)}
                error={errors.excerpt}
                maxLength={300}
                showCount
                rows={3}
              />
              <TextArea label="Texto" help="Separe os parágrafos com uma linha em branco." value={form.body} onChange={(e) => set("body", e.target.value)} error={errors.body} rows={14} />
            </div>
          </Card>

          <Card id="imagem" title="Imagem">
            <div className="grid gap-6">
              <ImagePicker value={form.image} onChange={(url) => set("image", url)} error={errors.image} />
              <TextInput
                label="Descrição da imagem"
                help="Texto alternativo para quem não vê a imagem (leitores de ecrã)."
                value={form.imageAlt}
                onChange={(e) => set("imageAlt", e.target.value)}
                error={errors.imageAlt}
                maxLength={200}
              />
            </div>
          </Card>

          <Card id="publicacao" title="Publicação">
            <div className={twoCols}>
              <div className="grid content-start gap-1.5">
                <span id="estado-label" className="text-sm text-zinc-500">
                  Estado
                </span>
                <div role="radiogroup" aria-labelledby="estado-label" className="grid h-11 grid-cols-2 rounded-lg bg-zinc-100 p-1">
                  {(
                    [
                      ["draft", "Rascunho"],
                      ["published", "Publicada"],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={form.status === value}
                      onClick={() => set("status", value)}
                      className={`rounded-md text-sm transition-colors ${form.status === value ? "bg-white font-medium text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-900"}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <p className="text-[13px] text-zinc-500">{form.status === "draft" ? "Não aparece no site." : "Visível no site."}</p>
              </div>
              <TextInput label="Data de publicação" type="date" value={form.publishedAt} onChange={(e) => set("publishedAt", e.target.value)} error={errors.publishedAt} />
              <label className={`flex items-start gap-3 rounded-xl border p-4 md:col-span-2 ${form.status === "published" ? "cursor-pointer border-zinc-200 hover:bg-zinc-50" : "border-zinc-100 opacity-60"}`}>
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded accent-blue-600"
                  checked={form.status === "published" && form.featured}
                  disabled={form.status !== "published"}
                  onChange={(e) => set("featured", e.target.checked)}
                />
                <span>
                  <span className="block text-sm font-medium text-zinc-900">Mostrar na página inicial</span>
                  <span className="block text-[13px] text-zinc-500">
                    {form.status === "published" ? "Entra no carrossel de notícias. A ordem define-se em «Página inicial»." : "Disponível apenas para notícias publicadas."}
                  </span>
                </span>
              </label>
            </div>
          </Card>

          <Card id="detalhes" title="Autor e endereço">
            <div className={twoCols}>
              <TextInput label="Autor" value={form.author} onChange={(e) => set("author", e.target.value)} error={errors.author} maxLength={100} />
              <TextInput label="Categoria (opcional)" value={form.category} onChange={(e) => set("category", e.target.value)} error={errors.category} maxLength={100} />
              <div className="md:col-span-2">
                <TextInput
                  label="Endereço (slug)"
                  help={isNew ? "Opcional. Se ficar vazio, é gerado a partir do título." : `Link público: /noticias/${form.slug || "…"}. Alterá-lo quebra links já partilhados.`}
                  value={form.slug}
                  onChange={(e) => set("slug", e.target.value.toLowerCase())}
                  error={errors.slug}
                  maxLength={80}
                  placeholder="ex.: colheita-de-outubro"
                />
              </div>
            </div>
            <div className="mt-8 flex flex-wrap gap-2 border-t border-zinc-100 pt-6">
              <Button type="submit" disabled={busy || (!isNew && !dirty)}>
                {busy ? "A guardar…" : isNew ? "Criar notícia" : "Guardar alterações"}
              </Button>
              <Button tone="secondary" onClick={() => (dirty ? discard() : navigate("/admin/noticias"))} disabled={busy}>
                Cancelar
              </Button>
            </div>
          </Card>
        </div>
        <SectionNav items={sections} />
      </div>

      <SaveBar visible={dirty} busy={busy} onSave={() => void save()} onDiscard={discard} />

      {confirmDelete ? (
        <ConfirmDialog
          title="Apagar notícia?"
          danger
          busy={busy}
          confirmLabel="Apagar"
          message="A notícia será apagada definitivamente."
          onConfirm={() => void doDelete()}
          onCancel={() => setConfirmDelete(false)}
        />
      ) : null}
    </form>
  );
}
