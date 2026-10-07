import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { ArrowSquareOut, MagnifyingGlass, PencilSimple, Plus, Star, Trash } from "@phosphor-icons/react";
import { api, ApiError } from "../../lib/api";
import { formatDate } from "../../lib/types";
import { useStats } from "../stats";
import { Badge, Button, ConfirmDialog, EmptyState, ErrorBox, IconButton, PageHeader, Spinner, useToast } from "../ui";

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
  createdAt?: string;
  updatedAt: string;
};

type Filter = "todas" | "published" | "draft";

export function PostsPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const { refresh } = useStats();
  const [params, setParams] = useSearchParams();
  const filter = (["published", "draft"].includes(params.get("estado") ?? "") ? params.get("estado") : "todas") as Filter;
  const query = params.get("q") ?? "";
  const [posts, setPosts] = useState<AdminPost[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<AdminPost | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api<{ posts: AdminPost[] }>("GET", "/admin/posts")
      .then((r) => setPosts(r.posts))
      .catch((e: unknown) => setError(e instanceof ApiError ? e.message : "Erro ao carregar."));
  }, []);
  useEffect(load, [load]);

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const counts = useMemo(
    () => ({
      todas: posts?.length ?? 0,
      published: posts?.filter((p) => p.status === "published").length ?? 0,
      draft: posts?.filter((p) => p.status === "draft").length ?? 0,
    }),
    [posts],
  );

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (posts ?? []).filter((p) => (filter === "todas" || p.status === filter) && (!q || p.title.toLowerCase().includes(q) || p.author.toLowerCase().includes(q)));
  }, [posts, filter, query]);

  async function confirmDelete() {
    if (!toDelete) return;
    setBusy(true);
    try {
      await api("DELETE", `/admin/posts/${toDelete.id}`);
      toast("ok", "Notícia apagada.");
      setToDelete(null);
      load();
      refresh();
    } catch (e) {
      toast("error", e instanceof ApiError ? e.message : "Não foi possível apagar.");
    } finally {
      setBusy(false);
    }
  }

  const tabs: Array<[Filter, string]> = [
    ["todas", "Todas"],
    ["published", "Publicadas"],
    ["draft", "Rascunhos"],
  ];

  return (
    <>
      <PageHeader
        title="Notícias"
        intro="Só as notícias publicadas aparecem no site. Os rascunhos ficam guardados aqui."
        actions={
          <Link to="/admin/noticias/nova">
            <Button tone="dark">
              <Plus size={16} weight="bold" aria-hidden /> Nova notícia
            </Button>
          </Link>
        }
      />
      {error ? <ErrorBox>{error}</ErrorBox> : null}
      {!posts && !error ? <Spinner /> : null}
      {posts ? (
        <section className="rounded-2xl border border-zinc-200/70 bg-white shadow-[0_1px_3px_rgb(0_0_0/0.04)]">
          <div className="flex flex-wrap items-center gap-3 border-b border-zinc-100 px-4 py-3 md:px-6">
            <div role="tablist" aria-label="Filtrar por estado" className="flex gap-1 overflow-x-auto">
              {tabs.map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={filter === value}
                  onClick={() => setParam("estado", value === "todas" ? null : value)}
                  className={`flex h-9 items-center gap-2 rounded-lg px-3 text-sm whitespace-nowrap transition-colors ${filter === value ? "bg-zinc-100 font-medium text-zinc-900" : "text-zinc-500 hover:text-zinc-900"}`}
                >
                  {label}
                  <span className="text-xs text-zinc-400 tabular-nums">{counts[value]}</span>
                </button>
              ))}
            </div>
            <div className="relative ml-auto w-full sm:w-64">
              <MagnifyingGlass size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-zinc-400" aria-hidden />
              <input
                type="search"
                aria-label="Filtrar por título ou autor"
                placeholder="Filtrar por título ou autor…"
                value={query}
                onChange={(e) => setParam("q", e.target.value || null)}
                className="h-9 w-full rounded-lg border border-zinc-200 bg-white pr-3 pl-9 text-sm placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
              />
            </div>
          </div>

          {shown.length === 0 ? (
            <div className="p-6">
              <EmptyState
                title={query ? "Nenhuma notícia corresponde à pesquisa." : filter === "draft" ? "Não há rascunhos." : "Ainda não há notícias."}
                action={
                  query ? (
                    <Button tone="secondary" onClick={() => setParam("q", null)}>
                      Limpar pesquisa
                    </Button>
                  ) : (
                    <Link to="/admin/noticias/nova">
                      <Button tone="secondary">Criar notícia</Button>
                    </Link>
                  )
                }
              />
            </div>
          ) : (
            <>
              <div className="hidden grid-cols-[minmax(0,1fr)_8rem_9rem_7.5rem] gap-4 border-b border-zinc-100 px-6 py-3 text-sm text-zinc-500 md:grid">
                <span>Notícia</span>
                <span>Estado</span>
                <span>Data</span>
                <span className="text-right">Ações</span>
              </div>
              <ul data-testid="posts-list">
                {shown.map((p) => (
                  <li
                    key={p.id}
                    className="group flex cursor-pointer items-center gap-3 border-b border-zinc-100 px-4 py-3.5 last:border-b-0 hover:bg-zinc-50/70 md:grid md:grid-cols-[minmax(0,1fr)_8rem_9rem_7.5rem] md:gap-4 md:px-6 md:py-4"
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest("a,button")) return;
                      navigate(`/admin/noticias/${p.id}`);
                    }}
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3 md:gap-4">
                      <img src={p.image} alt="" className="h-12 w-14 shrink-0 rounded-lg object-cover ring-1 ring-black/5 md:w-16" loading="lazy" />
                      <div className="min-w-0">
                        <Link to={`/admin/noticias/${p.id}`} className="line-clamp-2 font-medium text-zinc-900 hover:underline md:block md:truncate">
                          {p.title}
                        </Link>
                        <p className="mt-0.5 hidden items-center gap-1.5 truncate text-[13px] text-zinc-500 md:flex">
                          {p.author}
                          {p.featured ? (
                            <span className="inline-flex items-center gap-1 text-amber-700">
                              · <Star size={12} weight="fill" aria-hidden /> Na página inicial
                            </span>
                          ) : null}
                        </p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 md:hidden">
                          <Badge tone={p.status === "published" ? "green" : "gray"} dot>
                            {p.status === "published" ? "Publicada" : "Rascunho"}
                          </Badge>
                          <span className="text-[13px] text-zinc-500">{formatDate(p.publishedAt)}</span>
                          {p.featured ? <Star size={13} weight="fill" className="text-amber-600" aria-label="Na página inicial" /> : null}
                        </div>
                      </div>
                    </div>
                    <div className="hidden md:block">
                      <Badge tone={p.status === "published" ? "green" : "gray"} dot>
                        {p.status === "published" ? "Publicada" : "Rascunho"}
                      </Badge>
                    </div>
                    <span className="hidden text-sm text-zinc-600 tabular-nums md:block">{formatDate(p.publishedAt)}</span>
                    <div className="flex shrink-0 items-center justify-end gap-0.5">
                      {p.status === "published" ? (
                        <a href={`/noticias/${p.slug}`} target="_blank" rel="noopener noreferrer" aria-label={`Ver «${p.title}» no site`} title="Ver no site" className="hidden h-8 w-8 place-items-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 sm:inline-grid">
                          <ArrowSquareOut size={18} aria-hidden />
                        </a>
                      ) : null}
                      <Link to={`/admin/noticias/${p.id}`} aria-label={`Editar «${p.title}»`} title="Editar" className="hidden h-8 w-8 place-items-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 sm:inline-grid">
                        <PencilSimple size={18} aria-hidden />
                      </Link>
                      <IconButton label={`Apagar «${p.title}»`} onClick={() => setToDelete(p)} className="hover:!bg-red-50 hover:!text-red-600">
                        <Trash size={18} aria-hidden />
                      </IconButton>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      ) : null}
      {toDelete ? (
        <ConfirmDialog
          title="Apagar notícia?"
          danger
          busy={busy}
          confirmLabel="Apagar"
          message={<>A notícia «{toDelete.title}» será apagada definitivamente. Se só a quer esconder do site, passe-a a rascunho.</>}
          onConfirm={() => void confirmDelete()}
          onCancel={() => setToDelete(null)}
        />
      ) : null}
    </>
  );
}
