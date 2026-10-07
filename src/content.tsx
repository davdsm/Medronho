import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import defaults from "../shared/content.defaults.json";
import seed from "../shared/posts.seed.json";
import { api } from "./lib/api";
import type { PublicPost } from "./lib/types";

type Value = string | string[];

const DEFAULTS: Record<string, Value> = Object.fromEntries(
  (defaults.fields as Array<{ key: string; default: Value }>).map((f) => [f.key, f.default]),
);

/** Notícias de reserva (as iniciais), usadas apenas se a API estiver indisponível. */
const FALLBACK_POSTS: PublicPost[] = (seed as Array<Record<string, unknown>>)
  .filter((p) => p.status === "published")
  .map((p) => ({
    slug: String(p.slug),
    title: String(p.title),
    excerpt: String(p.excerpt),
    body: p.body as string[],
    image: String(p.image),
    imageAlt: String(p.imageAlt),
    author: String(p.author),
    category: String(p.category),
    publishedAt: String(p.publishedAt),
    updatedAt: String(p.publishedAt),
  }));

type SiteData = {
  content: Record<string, Value>;
  posts: PublicPost[];
  featured: PublicPost[];
};

const FALLBACK: SiteData = {
  content: DEFAULTS,
  posts: FALLBACK_POSTS,
  featured: FALLBACK_POSTS.filter((p) => (seed as Array<{ slug: string; featured?: boolean }>).some((s) => s.slug === p.slug && s.featured)),
};

const Ctx = createContext<SiteData>(FALLBACK);

/** Tempo máximo à espera da API antes de mostrar o site com os textos de reserva. */
const MAX_WAIT_MS = 3000;

export function SiteDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<SiteData | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setData((current) => current ?? FALLBACK);
    }, MAX_WAIT_MS);
    Promise.all([
      api<Record<string, Value>>("GET", "/content", undefined, controller.signal),
      api<{ posts: PublicPost[] }>("GET", "/posts", undefined, controller.signal),
      api<{ posts: PublicPost[] }>("GET", "/posts/featured", undefined, controller.signal),
    ])
      .then(([content, all, featured]) => {
        setData({ content: { ...DEFAULTS, ...content }, posts: all.posts, featured: featured.posts });
      })
      .catch((error) => {
        if ((error as Error).name === "AbortError") return;
        setData((current) => current ?? FALLBACK);
      })
      .finally(() => window.clearTimeout(timer));
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, []);

  if (!data) return null;
  return <Ctx.Provider value={data}>{children}</Ctx.Provider>;
}

export function useSite() {
  return useContext(Ctx);
}

/** Texto editável (string). */
export function useText(key: string): string {
  const { content } = useContext(Ctx);
  const v = content[key] ?? DEFAULTS[key];
  return typeof v === "string" ? v : "";
}

/** Lista / parágrafos editáveis. */
export function useList(key: string): string[] {
  const { content } = useContext(Ctx);
  const v = content[key] ?? DEFAULTS[key];
  return useMemo(() => (Array.isArray(v) ? v : []), [v]);
}

export function usePosts() {
  const { posts, featured } = useContext(Ctx);
  return { posts, featured };
}
