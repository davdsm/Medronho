import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { api, ApiError } from "../../lib/api";
import { formatDate } from "../../lib/types";
import { Button, Card, ErrorBox, PageHeader, Spinner, useToast, useUnsavedWarning } from "../ui";
import type { AdminPost } from "./PostsPage";

export function FeaturedPage() {
  const toast = useToast();
  const [posts, setPosts] = useState<AdminPost[] | null>(null);
  const [ids, setIds] = useState<number[]>([]);
  const [saved, setSaved] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api<{ posts: AdminPost[] }>("GET", "/admin/posts")
      .then(({ posts }) => {
        setPosts(posts);
        const f = posts
          .filter((p) => p.featured && p.status === "published")
          .sort((a, b) => a.featuredOrder - b.featuredOrder)
          .map((p) => p.id);
        setIds(f);
        setSaved(f);
      })
      .catch((e: unknown) => setError(e instanceof ApiError ? e.message : "Erro ao carregar."));
  }, []);
  useEffect(load, [load]);

  const dirty = JSON.stringify(ids) !== JSON.stringify(saved);
  useUnsavedWarning(dirty);

  if (error) return <ErrorBox>{error}</ErrorBox>;
  if (!posts) return <Spinner />;

  const byId = new Map(posts.map((p) => [p.id, p]));
  const available = posts.filter((p) => p.status === "published" && !ids.includes(p.id));

  const move = (index: number, delta: -1 | 1) => {
    const next = [...ids];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target]!, next[index]!];
    setIds(next);
  };

  async function save() {
    setBusy(true);
    try {
      await api("PUT", "/admin/featured", { ids });
      setSaved(ids);
      toast("ok", "Página inicial atualizada.");
    } catch (e) {
      toast("error", e instanceof ApiError ? e.message : "Não foi possível guardar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Página inicial"
        intro="Escolha que notícias aparecem no carrossel «Notícias» da página inicial e por que ordem. Sem nenhuma, a secção fica escondida."
        actions={
          <>
            <a href="/#noticias-home" target="_blank" rel="noopener noreferrer">
              <Button tone="secondary">Ver no site ↗</Button>
            </a>
            <Button onClick={() => void save()} disabled={!dirty || busy}>
              {busy ? "A guardar…" : "Guardar"}
            </Button>
          </>
        }
      />
      {dirty ? <p className="mb-4 text-sm font-medium text-ink-soft">Tem alterações por guardar.</p> : null}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 [&>*]:min-w-0">
        <Card>
          <h2 className="font-display text-xl tracking-tight">Em destaque ({ids.length})</h2>
          {ids.length === 0 ? <p className="mt-3 text-ink-soft">Nenhuma notícia em destaque.</p> : null}
          <ol className="mt-4 grid gap-2" data-testid="featured-list">
            {ids.map((id, index) => {
              const p = byId.get(id)!;
              return (
                <li key={id} className="flex flex-wrap items-center gap-3 rounded-xl bg-beige p-2.5">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-wine text-sm font-bold text-foam">{index + 1}</span>
                  <img src={p.image} alt="" className="h-12 w-16 shrink-0 rounded-md object-cover" />
                  <div className="min-w-0 flex-1 basis-32">
                    <p className="truncate font-semibold">{p.title}</p>
                    <p className="text-xs text-ink-soft">{formatDate(p.publishedAt)}</p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button tone="secondary" small aria-label={`Subir «${p.title}»`} disabled={index === 0} onClick={() => move(index, -1)}>
                      ↑
                    </Button>
                    <Button tone="secondary" small aria-label={`Descer «${p.title}»`} disabled={index === ids.length - 1} onClick={() => move(index, 1)}>
                      ↓
                    </Button>
                    <Button tone="ghost" small className="!text-berry" aria-label={`Remover «${p.title}» dos destaques`} onClick={() => setIds(ids.filter((x) => x !== id))}>
                      Remover
                    </Button>
                  </div>
                </li>
              );
            })}
          </ol>
        </Card>
        <Card>
          <h2 className="font-display text-xl tracking-tight">Notícias publicadas ({available.length})</h2>
          {available.length === 0 ? <p className="mt-3 text-ink-soft">Todas as notícias publicadas já estão em destaque.</p> : null}
          <ul className="mt-4 grid gap-2">
            {available.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-3 rounded-xl p-2.5 ring-1 ring-ink/10">
                <img src={p.image} alt="" className="h-12 w-16 shrink-0 rounded-md object-cover" />
                <div className="min-w-0 flex-1 basis-32">
                  <p className="truncate font-semibold">{p.title}</p>
                  <p className="text-xs text-ink-soft">{formatDate(p.publishedAt)}</p>
                </div>
                <Button tone="secondary" small aria-label={`Destacar «${p.title}»`} onClick={() => setIds([...ids, p.id])}>
                  Destacar
                </Button>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-ink-soft">
            Os rascunhos não podem ser destacados. <Link to="/admin/noticias" className="underline">Gerir notícias</Link>
          </p>
        </Card>
      </div>
    </>
  );
}
