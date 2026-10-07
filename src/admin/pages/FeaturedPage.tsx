import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { ArrowDown, ArrowSquareOut, ArrowUp, Plus, X } from "@phosphor-icons/react";
import { api, ApiError } from "../../lib/api";
import { formatDate } from "../../lib/types";
import { useStats } from "../stats";
import { Button, Card, EmptyState, ErrorBox, IconButton, PageHeader, SaveBar, Spinner, useToast, useUnsavedWarning } from "../ui";
import type { AdminPost } from "./PostsPage";

export function FeaturedPage() {
  const toast = useToast();
  const { refresh } = useStats();
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
      refresh();
      toast("ok", "Página inicial atualizada.");
    } catch (e) {
      toast("error", e instanceof ApiError ? e.message : "Não foi possível guardar.");
    } finally {
      setBusy(false);
    }
  }

  const thumb = (p: AdminPost) => <img src={p.image} alt="" className="h-11 w-14 shrink-0 rounded-lg object-cover ring-1 ring-black/5" />;

  return (
    <>
      <PageHeader
        title="Página inicial"
        intro="Escolha as notícias do carrossel «Notícias» da página inicial e a ordem em que aparecem. Sem nenhuma escolhida, a secção não é mostrada."
        actions={
          <>
            <Button onClick={() => void save()} disabled={!dirty || busy}>
              {busy ? "A guardar…" : "Guardar"}
            </Button>
            <a href="/#noticias-home" target="_blank" rel="noopener noreferrer">
              <Button tone="secondary">
                <ArrowSquareOut size={16} aria-hidden /> Ver no site
              </Button>
            </a>
          </>
        }
      />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <Card title={`No carrossel (${ids.length})`} description="Por esta ordem, da esquerda para a direita.">
          {ids.length === 0 ? <EmptyState title="Nenhuma notícia em destaque.">Adicione notícias a partir da lista ao lado.</EmptyState> : null}
          <ol className="grid gap-2" data-testid="featured-list">
            {ids.map((id, index) => {
              const p = byId.get(id)!;
              return (
                <li key={id} className="flex items-center gap-3 rounded-xl border border-zinc-200 p-2.5 pr-1.5">
                  <span className="w-5 shrink-0 text-center text-sm font-medium text-zinc-400 tabular-nums">{index + 1}</span>
                  {thumb(p)}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-medium text-zinc-900">{p.title}</p>
                    <p className="text-[13px] text-zinc-500">{formatDate(p.publishedAt)}</p>
                  </div>
                  <div className="flex shrink-0 items-center">
                    <IconButton label={`Subir «${p.title}»`} disabled={index === 0} onClick={() => move(index, -1)}>
                      <ArrowUp size={16} aria-hidden />
                    </IconButton>
                    <IconButton label={`Descer «${p.title}»`} disabled={index === ids.length - 1} onClick={() => move(index, 1)}>
                      <ArrowDown size={16} aria-hidden />
                    </IconButton>
                    <IconButton label={`Remover «${p.title}» do carrossel`} onClick={() => setIds(ids.filter((x) => x !== id))} className="hover:!bg-red-50 hover:!text-red-600">
                      <X size={16} aria-hidden />
                    </IconButton>
                  </div>
                </li>
              );
            })}
          </ol>
        </Card>
        <Card title={`Outras publicadas (${available.length})`} description={<>Os rascunhos não aparecem aqui. <Link to="/admin/noticias" className="text-blue-600 hover:underline">Gerir notícias</Link></>}>
          {available.length === 0 ? <EmptyState title="Todas as notícias publicadas já estão no carrossel." /> : null}
          <ul className="grid gap-2">
            {available.map((p) => (
              <li key={p.id} className="flex items-center gap-3 rounded-xl border border-zinc-200 p-2.5">
                {thumb(p)}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-medium text-zinc-900">{p.title}</p>
                  <p className="text-[13px] text-zinc-500">{formatDate(p.publishedAt)}</p>
                </div>
                <Button tone="secondary" small aria-label={`Destacar «${p.title}»`} onClick={() => setIds([...ids, p.id])}>
                  <Plus size={14} weight="bold" aria-hidden /> Adicionar
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      </div>
      <SaveBar visible={dirty} busy={busy} onSave={() => void save()} onDiscard={() => setIds(saved)} />
    </>
  );
}
