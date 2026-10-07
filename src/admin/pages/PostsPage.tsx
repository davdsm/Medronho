import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { api, ApiError } from "../../lib/api";
import { formatDate } from "../../lib/types";
import { Badge, Button, Card, ConfirmDialog, ErrorBox, PageHeader, Spinner, useToast } from "../ui";

export type AdminPost = {
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
  updatedAt: string;
};

export function PostsPage() {
  const toast = useToast();
  const [posts, setPosts] = useState<AdminPost[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "published" | "draft">("all");
  const [query, setQuery] = useState("");
  const [toDelete, setToDelete] = useState<AdminPost | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api<{ posts: AdminPost[] }>("GET", "/admin/posts")
      .then((r) => setPosts(r.posts))
      .catch((e: unknown) => setError(e instanceof ApiError ? e.message : "Erro ao carregar."));
  }, []);
  useEffect(load, [load]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (posts ?? []).filter((p) => (filter === "all" || p.status === filter) && (!q || p.title.toLowerCase().includes(q)));
  }, [posts, filter, query]);

  async function confirmDelete() {
    if (!toDelete) return;
    setBusy(true);
    try {
      await api("DELETE", `/admin/posts/${toDelete.id}`);
      toast("ok", "Notícia apagada.");
      setToDelete(null);
      load();
    } catch (e) {
      toast("error", e instanceof ApiError ? e.message : "Não foi possível apagar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Notícias"
        intro="Crie, edite e publique notícias. Só as notícias publicadas aparecem no site."
        actions={
          <Link to="/admin/noticias/nova">
            <Button>Nova notícia</Button>
          </Link>
        }
      />
      {error ? <ErrorBox>{error}</ErrorBox> : null}
      {!posts && !error ? <Spinner /> : null}
      {posts ? (
        <Card className="!p-0 overflow-hidden">
          <div className="flex flex-wrap items-center gap-3 border-b border-ink/10 p-4">
            <input
              type="search"
              aria-label="Procurar notícias"
              placeholder="Procurar por título…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="min-w-0 flex-1 rounded-lg border border-ink/20 px-3 py-2 text-[15px] focus:border-wine focus:outline-none focus:ring-2 focus:ring-wine/20"
            />
            <div role="group" aria-label="Filtrar por estado" className="flex gap-1">
              {(
                [
                  ["all", "Todas"],
                  ["published", "Publicadas"],
                  ["draft", "Rascunhos"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={filter === value}
                  onClick={() => setFilter(value)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${filter === value ? "bg-wine text-foam" : "text-ink-soft hover:bg-ink/5"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          {shown.length === 0 ? (
            <p className="p-8 text-center text-ink-soft">Nenhuma notícia encontrada.</p>
          ) : (
            <ul>
              {shown.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center gap-4 border-b border-ink/10 p-4 last:border-b-0">
                  <img src={p.image} alt="" className="h-16 w-24 shrink-0 rounded-lg object-cover" loading="lazy" />
                  <div className="min-w-0 flex-1 basis-56">
                    <Link to={`/admin/noticias/${p.id}`} className="font-semibold text-ink underline-offset-4 hover:underline">
                      {p.title}
                    </Link>
                    <p className="mt-1 text-sm text-ink-soft">
                      {formatDate(p.publishedAt)} · {p.author}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={p.status === "published" ? "green" : "gray"}>{p.status === "published" ? "Publicada" : "Rascunho"}</Badge>
                    {p.featured ? <Badge tone="yellow">Na página inicial</Badge> : null}
                  </div>
                  <div className="flex gap-2">
                    {p.status === "published" ? (
                      <a href={`/noticias/${p.slug}`} target="_blank" rel="noopener noreferrer">
                        <Button tone="ghost" small>
                          Ver ↗
                        </Button>
                      </a>
                    ) : null}
                    <Link to={`/admin/noticias/${p.id}`}>
                      <Button tone="secondary" small>
                        Editar
                      </Button>
                    </Link>
                    <Button tone="ghost" small className="!text-berry" onClick={() => setToDelete(p)}>
                      Apagar
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      ) : null}
      {toDelete ? (
        <ConfirmDialog
          title="Apagar notícia?"
          danger
          busy={busy}
          confirmLabel="Apagar"
          message={
            <>
              A notícia «{toDelete.title}» será apagada definitivamente. Se só quer escondê-la do site, passe-a a rascunho.
            </>
          }
          onConfirm={() => void confirmDelete()}
          onCancel={() => setToDelete(null)}
        />
      ) : null}
    </>
  );
}
