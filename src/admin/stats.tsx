import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "../lib/api";
import type { AdminPost } from "./pages/PostsPage";

type Stats = {
  total: number;
  published: number;
  drafts: number;
  featured: number;
  uploads: number;
  users: number | null;
  recent: AdminPost[];
};

const empty: Stats = { total: 0, published: 0, drafts: 0, featured: 0, uploads: 0, users: null, recent: [] };
const Ctx = createContext<{ stats: Stats; refresh: () => void }>({ stats: empty, refresh: () => {} });

/** Contagens da barra lateral e últimas notícias editadas. As páginas chamam `refresh()` depois de alterar dados. */
export function StatsProvider({ children, isAdmin }: { children: ReactNode; isAdmin: boolean }) {
  const [stats, setStats] = useState<Stats>(empty);
  const refresh = useCallback(() => {
    Promise.all([
      api<{ posts: AdminPost[] }>("GET", "/admin/posts"),
      api<{ uploads: unknown[] }>("GET", "/admin/uploads"),
      isAdmin ? api<{ users: unknown[] }>("GET", "/admin/users") : Promise.resolve(null),
    ])
      .then(([p, u, us]) => {
        const posts = p.posts;
        setStats({
          total: posts.length,
          published: posts.filter((x) => x.status === "published").length,
          drafts: posts.filter((x) => x.status === "draft").length,
          featured: posts.filter((x) => x.featured && x.status === "published").length,
          uploads: u.uploads.length,
          users: us ? us.users.length : null,
          recent: [...posts].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5),
        });
      })
      .catch(() => {
        /* a barra lateral não é crítica */
      });
  }, [isAdmin]);
  useEffect(refresh, [refresh]);
  return <Ctx.Provider value={{ stats, refresh }}>{children}</Ctx.Provider>;
}

export const useStats = () => useContext(Ctx);
