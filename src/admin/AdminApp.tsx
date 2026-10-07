import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Navigate, NavLink, Outlet, Route, Routes, useLocation, useNavigate, useSearchParams } from "react-router";
import {
  ArrowSquareOut,
  CaretDown,
  House,
  Images,
  List,
  MagnifyingGlass,
  Newspaper,
  SignOut,
  TextAa,
  UserCircle,
  Users,
  X,
} from "@phosphor-icons/react";
import "./admin.css";
import { AuthProvider, useAuth } from "./auth";
import { AccountPage } from "./pages/AccountPage";
import { FeaturedPage } from "./pages/FeaturedPage";
import { LoginPage } from "./pages/LoginPage";
import { MediaPage } from "./pages/MediaPage";
import { PostEditorPage } from "./pages/PostEditorPage";
import { PostsPage } from "./pages/PostsPage";
import { TextsPage } from "./pages/TextsPage";
import { UsersPage } from "./pages/UsersPage";
import { StatsProvider, useStats } from "./stats";
import { initials, Spinner, ToastProvider } from "./ui";

function useNoIndex() {
  useEffect(() => {
    document.head.querySelectorAll('meta[name="robots"]').forEach((el) => el.remove());
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    const previous = document.title;
    document.title = "Backoffice · UNEDO4ALL";
    return () => {
      meta.remove();
      document.title = previous;
    };
  }, []);
}

/* ---------- Barra lateral ---------- */

function SectionLabel({ children }: { children: ReactNode }) {
  return <p className="mb-2 px-3 text-[11px] font-semibold tracking-[0.08em] text-zinc-400 uppercase">{children}</p>;
}

function Count({ n }: { n: number | null | undefined }) {
  if (n === null || n === undefined) return null;
  return <span className="ml-auto text-[13px] text-zinc-400 tabular-nums">{n}</span>;
}

const itemBase = "flex items-center gap-3 rounded-lg px-3 py-2 text-[15px] transition-colors";
const itemClass = ({ isActive }: { isActive: boolean }) =>
  `${itemBase} ${isActive ? "bg-zinc-100 font-medium text-zinc-900" : "text-zinc-600 hover:bg-zinc-100/70 hover:text-zinc-900"}`;

function NewsGroup({ onNavigate }: { onNavigate: () => void }) {
  const { stats } = useStats();
  const location = useLocation();
  const [params] = useSearchParams();
  const inNews = location.pathname.startsWith("/admin/noticias");
  const [open, setOpen] = useState(true);
  const estado = location.pathname === "/admin/noticias" ? (params.get("estado") ?? "todas") : null;
  const sub = [
    { key: "todas", label: "Todas", to: "/admin/noticias", n: stats.total },
    { key: "published", label: "Publicadas", to: "/admin/noticias?estado=published", n: stats.published },
    { key: "draft", label: "Rascunhos", to: "/admin/noticias?estado=draft", n: stats.drafts },
  ];
  return (
    <li>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`${itemBase} w-full ${inNews ? "font-medium text-zinc-900" : "text-zinc-600 hover:bg-zinc-100/70 hover:text-zinc-900"}`}
      >
        <Newspaper size={20} aria-hidden />
        Notícias
        <CaretDown size={14} weight="bold" className={`ml-auto text-zinc-400 transition-transform ${open ? "" : "-rotate-90"}`} aria-hidden />
      </button>
      {open ? (
        <ul className="mt-0.5 grid gap-0.5 pl-6">
          {sub.map((s) => {
            const active = estado === s.key;
            return (
              <li key={s.key}>
                <NavLink
                  to={s.to}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-lg py-1.5 pr-3 pl-5 text-[15px] transition-colors ${active ? "font-medium text-blue-600" : "text-zinc-600 hover:text-zinc-900"}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-blue-600" : "bg-zinc-300"}`} aria-hidden />
                  {s.label}
                  <Count n={s.n} />
                </NavLink>
              </li>
            );
          })}
        </ul>
      ) : null}
    </li>
  );
}

function Sidebar({ onNavigate }: { onNavigate: () => void }) {
  const { user } = useAuth();
  const { stats } = useStats();
  return (
    <div className="flex h-full flex-col gap-8 overflow-y-auto px-4 py-6">
      <div>
        <SectionLabel>Conteúdo</SectionLabel>
        <ul className="grid gap-0.5">
          <NewsGroup onNavigate={onNavigate} />
          <li>
            <NavLink to="/admin/destaques" onClick={onNavigate} className={itemClass}>
              <House size={20} aria-hidden />
              Página inicial
              <Count n={stats.featured} />
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/textos" onClick={onNavigate} className={itemClass}>
              <TextAa size={20} aria-hidden />
              Textos do site
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/imagens" onClick={onNavigate} className={itemClass}>
              <Images size={20} aria-hidden />
              Imagens
              <Count n={stats.uploads} />
            </NavLink>
          </li>
        </ul>
      </div>

      <div>
        <SectionLabel>Conta</SectionLabel>
        <ul className="grid gap-0.5">
          {user?.role === "admin" ? (
            <li>
              <NavLink to="/admin/utilizadores" onClick={onNavigate} className={itemClass}>
                <Users size={20} aria-hidden />
                Utilizadores
                <Count n={stats.users} />
              </NavLink>
            </li>
          ) : null}
          <li>
            <NavLink to="/admin/conta" onClick={onNavigate} className={itemClass}>
              <UserCircle size={20} aria-hidden />A minha conta
            </NavLink>
          </li>
        </ul>
      </div>

      {stats.recent.length ? (
        <div>
          <SectionLabel>Editadas recentemente</SectionLabel>
          <ul className="grid gap-0.5">
            {stats.recent.map((p) => (
              <li key={p.id}>
                <NavLink to={`/admin/noticias/${p.id}`} onClick={onNavigate} className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm transition-colors ${isActive ? "bg-zinc-100 text-zinc-900" : "text-zinc-700 hover:bg-zinc-100/70"}`}>
                  <img src={p.image} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-black/5" />
                  <span className="truncate">{p.title}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

/* ---------- Barra de topo ---------- */

function SearchBox() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const location = useLocation();
  const [q, setQ] = useState(location.pathname === "/admin/noticias" ? (params.get("q") ?? "") : "");
  useEffect(() => {
    if (location.pathname !== "/admin/noticias") setQ("");
  }, [location.pathname]);
  function submit(e: FormEvent) {
    e.preventDefault();
    const next = new URLSearchParams();
    const estado = location.pathname === "/admin/noticias" ? params.get("estado") : null;
    if (estado) next.set("estado", estado);
    if (q.trim()) next.set("q", q.trim());
    navigate(`/admin/noticias${next.size ? `?${next}` : ""}`);
  }
  return (
    <form role="search" onSubmit={submit} className="relative w-full max-w-md">
      <MagnifyingGlass size={18} className="pointer-events-none absolute top-1/2 left-0 -translate-y-1/2 text-zinc-400" aria-hidden />
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        aria-label="Procurar notícias"
        placeholder="Procurar notícias por título…"
        className="h-10 w-full border-0 bg-transparent pr-2 pl-7 text-[15px] text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
      />
    </form>
  );
}

function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  if (!user) return null;
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Menu de ${user.name}`}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full p-0.5 pr-2 hover:bg-zinc-100"
      >
        <span className="grid h-9 w-9 place-items-center rounded-full bg-zinc-900 text-[13px] font-semibold text-white">{initials(user.name)}</span>
        <CaretDown size={14} weight="bold" className="text-zinc-500" aria-hidden />
      </button>
      {open ? (
        <div role="menu" className="absolute top-full right-0 z-40 mt-2 w-64 rounded-xl border border-zinc-200 bg-white p-1.5 shadow-lg">
          <div className="px-3 py-2">
            <p className="truncate text-sm font-medium text-zinc-900">{user.name}</p>
            <p className="truncate text-[13px] text-zinc-500">{user.email}</p>
          </div>
          <div className="my-1 h-px bg-zinc-100" />
          <NavLink role="menuitem" to="/admin/conta" onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100">
            <UserCircle size={18} aria-hidden /> A minha conta
          </NavLink>
          <a role="menuitem" href="/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100">
            <ArrowSquareOut size={18} aria-hidden /> Ver o site
          </a>
          <button role="menuitem" type="button" onClick={() => void logout()} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100">
            <SignOut size={18} aria-hidden /> Terminar sessão
          </button>
        </div>
      ) : null}
    </div>
  );
}

function Brand() {
  return (
    <NavLink to="/admin/noticias" className="flex items-center gap-2.5" aria-label="Backoffice UNEDO4ALL, início">
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-zinc-900 text-[13px] font-bold text-white">U4</span>
      <span className="leading-tight">
        <span className="block text-sm font-semibold text-zinc-900">UNEDO4ALL</span>
        <span className="block text-xs text-zinc-500">Backoffice</span>
      </span>
    </NavLink>
  );
}

function Layout() {
  const { user } = useAuth();
  const location = useLocation();
  const [drawer, setDrawer] = useState(false);
  useEffect(() => setDrawer(false), [location.pathname, location.search]);
  if (!user) return <Navigate to="/admin/entrar" replace state={{ from: location.pathname + location.search }} />;
  return (
    <StatsProvider isAdmin={user.role === "admin"}>
      <div className="admin-root min-h-dvh">
        <a href="#admin-main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:shadow">
          Saltar para o conteúdo
        </a>
        <header className="sticky top-0 z-30 border-b border-zinc-200/70 bg-[#f7f7f8]/90 backdrop-blur">
          <div className="flex h-16 items-center gap-4 px-4 lg:px-8">
            <button type="button" className="grid h-10 w-10 place-items-center rounded-lg text-zinc-700 hover:bg-zinc-100 lg:hidden" aria-label="Abrir menu" onClick={() => setDrawer(true)}>
              <List size={22} aria-hidden />
            </button>
            <div className="hidden w-60 shrink-0 lg:block">
              <Brand />
            </div>
            <div className="min-w-0 flex-1">
              <SearchBox />
            </div>
            <a href="/" target="_blank" rel="noopener noreferrer" className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 sm:flex">
              Ver site <ArrowSquareOut size={16} aria-hidden />
            </a>
            <UserMenu />
          </div>
        </header>

        <div className="flex">
          <aside aria-label="Navegação do backoffice" className="sticky top-16 hidden h-[calc(100dvh-4rem)] w-72 shrink-0 lg:block">
            <Sidebar onNavigate={() => {}} />
          </aside>

          {drawer ? (
            <div className="fixed inset-0 z-40 lg:hidden">
              <div className="absolute inset-0 bg-zinc-900/40" onClick={() => setDrawer(false)} />
              <aside aria-label="Navegação do backoffice" className="absolute inset-y-0 left-0 flex w-[min(20rem,85vw)] flex-col bg-white shadow-2xl">
                <div className="flex h-16 items-center justify-between border-b border-zinc-100 px-4">
                  <Brand />
                  <button type="button" aria-label="Fechar menu" className="grid h-10 w-10 place-items-center rounded-lg hover:bg-zinc-100" onClick={() => setDrawer(false)}>
                    <X size={20} aria-hidden />
                  </button>
                </div>
                <Sidebar onNavigate={() => setDrawer(false)} />
              </aside>
            </div>
          ) : null}

          <main id="admin-main" className="min-w-0 flex-1 px-4 pt-8 pb-28 md:px-8 lg:pt-10 lg:pr-10">
            <div className="mx-auto max-w-[1180px]">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </StatsProvider>
  );
}

function RequireAdmin({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  if (user?.role !== "admin") return <Navigate to="/admin/noticias" replace />;
  return <>{children}</>;
}

function Gate() {
  const { loading } = useAuth();
  if (loading) {
    return (
      <div className="admin-root grid min-h-dvh place-items-center">
        <div className="w-72">
          <Spinner />
        </div>
      </div>
    );
  }
  return (
    <Routes>
      <Route path="entrar" element={<LoginPage />} />
      <Route element={<Layout />}>
        <Route index element={<Navigate to="noticias" replace />} />
        <Route path="noticias" element={<PostsPage />} />
        <Route path="noticias/nova" element={<PostEditorPage />} />
        <Route path="noticias/:id" element={<PostEditorPage />} />
        <Route path="destaques" element={<FeaturedPage />} />
        <Route path="textos" element={<TextsPage />} />
        <Route path="imagens" element={<MediaPage />} />
        <Route
          path="utilizadores"
          element={
            <RequireAdmin>
              <UsersPage />
            </RequireAdmin>
          }
        />
        <Route path="conta" element={<AccountPage />} />
        <Route path="*" element={<Navigate to="/admin/noticias" replace />} />
      </Route>
    </Routes>
  );
}

export default function AdminApp() {
  useNoIndex();
  return (
    <AuthProvider>
      <ToastProvider>
        <Gate />
      </ToastProvider>
    </AuthProvider>
  );
}
