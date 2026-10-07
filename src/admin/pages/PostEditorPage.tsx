import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { api, ApiError } from "../../lib/api";
import { ImagePicker } from "../ImagePicker";
import { Button, Card, ConfirmDialog, ErrorBox, PageHeader, Select, Spinner, TextArea, TextInput, useToast, useUnsavedWarning } from "../ui";
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

const today = () => new Date().toISOString().slice(0, 10);

const empty = (): Form => ({
  title: "",
  slug: "",
  excerpt: "",
  body: "",
  image: "/photos/harvest.jpg",
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

export function PostEditorPage() {
  const { id } = useParams();
  const isNew = id === undefined;
  const navigate = useNavigate();
  const toast = useToast();
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

  if (loadError) {
    return (
      <>
        <ErrorBox>{loadError}</ErrorBox>
        <p className="mt-4">
          <Link to="/admin/noticias" className="underline">
            Voltar às notícias
          </Link>
        </p>
      </>
    );
  }
  if (!form) return <Spinner />;

  const set = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm({ ...form, [key]: value });
    if (errors[key]) setErrors({ ...errors, [key]: "" });
  };

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    setBusy(true);
    setErrors({});
    setFormError(null);
    const paragraphs = form.body
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean);
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
      const res = isNew
        ? await api<{ post: AdminPost }>("POST", "/admin/posts", payload)
        : await api<{ post: AdminPost }>("PUT", `/admin/posts/${id}`, payload);
      toast("ok", isNew ? "Notícia criada." : "Alterações guardadas.");
      const f = fromPost(res.post);
      setForm(f);
      setInitial(JSON.stringify(f));
      setSaved(res.post);
      if (isNew) navigate(`/admin/noticias/${res.post.id}`, { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.fields ?? {});
        setFormError(err.message);
      } else setFormError("Erro inesperado.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setBusy(false);
    }
  }

  async function doDelete() {
    setBusy(true);
    try {
      await api("DELETE", `/admin/posts/${id}`);
      toast("ok", "Notícia apagada.");
      setInitial(JSON.stringify(form));
      navigate("/admin/noticias");
    } catch (err) {
      toast("error", err instanceof ApiError ? err.message : "Não foi possível apagar.");
      setConfirmDelete(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate>
      <PageHeader
        title={isNew ? "Nova notícia" : "Editar notícia"}
        actions={
          <>
            <Link to="/admin/noticias">
              <Button tone="secondary">Voltar</Button>
            </Link>
            {saved && saved.status === "published" ? (
              <a href={`/noticias/${saved.slug}`} target="_blank" rel="noopener noreferrer">
                <Button tone="secondary">Ver no site ↗</Button>
              </a>
            ) : null}
          </>
        }
      />
      {formError ? (
        <div className="mb-5">
          <ErrorBox>{formError}</ErrorBox>
        </div>
      ) : null}
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <Card className="grid content-start gap-5">
          <TextInput label="Título" value={form.title} onChange={(e) => set("title", e.target.value)} error={errors.title} maxLength={160} required />
          <TextArea
            label="Resumo"
            help="Aparece nas listas e na página inicial. Até 300 caracteres."
            value={form.excerpt}
            onChange={(e) => set("excerpt", e.target.value)}
            error={errors.excerpt}
            maxLength={300}
            rows={3}
          />
          <TextArea
            label="Texto"
            help="Separe os parágrafos com uma linha em branco."
            value={form.body}
            onChange={(e) => set("body", e.target.value)}
            error={errors.body}
            rows={14}
          />
          <ImagePicker value={form.image} onChange={(url) => set("image", url)} error={errors.image} />
          <TextInput
            label="Descrição da imagem"
            help="Texto alternativo, para quem não vê a imagem (acessibilidade)."
            value={form.imageAlt}
            onChange={(e) => set("imageAlt", e.target.value)}
            error={errors.imageAlt}
            maxLength={200}
          />
        </Card>
        <div className="grid content-start gap-6">
          <Card className="grid gap-5">
            <Select label="Estado" value={form.status} onChange={(e) => set("status", e.target.value as Form["status"])} error={errors.status}>
              <option value="draft">Rascunho (não aparece no site)</option>
              <option value="published">Publicada</option>
            </Select>
            <TextInput label="Data de publicação" type="date" value={form.publishedAt} onChange={(e) => set("publishedAt", e.target.value)} error={errors.publishedAt} />
            <label className="flex items-start gap-3 text-[15px]">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 accent-[var(--color-wine)]"
                checked={form.status === "published" && form.featured}
                disabled={form.status !== "published"}
                onChange={(e) => set("featured", e.target.checked)}
              />
              <span>
                <span className="font-semibold">Mostrar na página inicial</span>
                <span className="block text-[13px] text-ink-soft">Só notícias publicadas. A ordem define-se em «Página inicial».</span>
              </span>
            </label>
          </Card>
          <Card className="grid gap-5">
            <TextInput label="Autor" value={form.author} onChange={(e) => set("author", e.target.value)} error={errors.author} maxLength={100} />
            <TextInput label="Categoria (opcional)" value={form.category} onChange={(e) => set("category", e.target.value)} error={errors.category} maxLength={100} />
            <TextInput
              label="Endereço (slug)"
              help={isNew ? "Opcional. Se vazio, é gerado a partir do título." : "Alterar muda o link público da notícia."}
              value={form.slug}
              onChange={(e) => set("slug", e.target.value)}
              error={errors.slug}
              maxLength={80}
            />
          </Card>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={busy || !dirty}>
              {busy ? "A guardar…" : isNew ? "Criar notícia" : "Guardar alterações"}
            </Button>
            {!isNew ? (
              <Button tone="ghost" className="!text-berry" onClick={() => setConfirmDelete(true)} disabled={busy}>
                Apagar
              </Button>
            ) : null}
          </div>
          {dirty ? <p className="text-sm text-ink-soft">Tem alterações por guardar.</p> : null}
        </div>
      </div>
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
