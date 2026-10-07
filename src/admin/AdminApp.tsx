import { useEffect } from "react";
import { Navigate, NavLink, Outlet, Route, Routes, useLocation } from "react-router";
import { AuthProvider, useAuth } from "./auth";
import { AccountPage } from "./pages/AccountPage";
import { FeaturedPage } from "./pages/FeaturedPage";
import { LoginPage } from "./pages/LoginPage";
import { MediaPage } from "./pages/MediaPage";
import { PostEditorPage } from "./pages/PostEditorPage";
import { PostsPage } from "./pages/PostsPage";
import { TextsPage } from "./pages/TextsPage";
import { UsersPage } from "./pages/UsersPage";
import { Button, Spinner, ToastProvider } from "./ui";

function useNoIndex() {
  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    const previous = document.title;
    document.title = "Backoffice · UNEDO4ALL";
    // Remove as etiquetas de SEO do site público que possam ter ficado de uma navegação anterior.
    document.head.querySelectorAll('meta[name="robots"]').forEach((el) => el !== meta && el.remove());
    return () => {
      meta.remove();
      document.title = previous;
    };
  }, []);
}

const nav = [
  { to: "/admin/noticias", label: "Notícias" },
  { to: "/admin/destaques", label: "Página inicial" },
  { to: "/admin/textos", label: "Textos" },
  { to: "/admin/imagens", label: "Imagens" },
];

function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/admin/entrar" replace state={{ from: location.pathname }} />;
  const links = user.role === "admin" ? [...nav, { to: "/admin/utilizadores", label: "Utilizadores" }] : nav;
  return (
    <div className="min-h-dvh bg-beige text-ink">
      <header className="sticky top-0 z-30 bg-wine text-foam">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 md:px-8">
          <NavLink to="/admin" end className="flex items-center gap-3">
            <img src="/brand/unedo4all-logo.png" alt="UNEDO4ALL" width={619} height={103} className="h-7 w-auto" />
            <span className="rounded-full bg-butter px-2 py-0.5 text-xs font-bold text-ink">Backoffice</span>
          </NavLink>
          <nav aria-label="Backoffice" className="order-3 flex w-full flex-wrap gap-1 md:order-none md:w-auto md:flex-1">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-1.5 text-[15px] font-semibold transition ${isActive ? "bg-foam text-wine" : "text-foam/85 hover:bg-foam/10"}`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2 text-sm">
            <NavLink to="/admin/conta" className="rounded-lg px-2 py-1 font-medium hover:bg-foam/10" title="A minha conta">
              {user.name}
            </NavLink>
            <a href="/" target="_blank" rel="noopener noreferrer" className="rounded-lg px-2 py-1 font-medium hover:bg-foam/10">
              Ver site ↗
            </a>
            <Button tone="ghost" small className="!text-foam hover:!bg-foam/10" onClick={() => void logout()}>
              Terminar sessão
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1200px] px-4 py-8 md:px-8 md:py-10">
        <Outlet />
      </main>
    </div>
  );
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (user?.role !== "admin") return <Navigate to="/admin/noticias" replace />;
  return <>{children}</>;
}

function Gate() {
  const { loading } = useAuth();
  if (loading) {
    return (
      <div className="grid min-h-dvh place-items-center bg-beige">
        <Spinner />
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
