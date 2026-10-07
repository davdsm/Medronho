import { useEffect, useRef } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from "react-router";
import { BerryCanvas, BerryGuard } from "./components/Berry";
import { Intro } from "./components/Intro";
import { Footer } from "./components/Footer";
import { Nav } from "./components/Nav";
import { PageTransition, type PageTransitionHandle } from "./components/PageTransition";
import { SmoothScroll } from "./components/SmoothScroll";
import { ScrollTrigger } from "./gsap";
import { scrollBus } from "./scene";
import { useReduced } from "./useReduced";
import { AboutPage } from "./pages/AboutPage";
import { ArticlePage } from "./pages/ArticlePage";
import { ConsortiumPage } from "./pages/ConsortiumPage";
import { HomePage } from "./pages/HomePage";
import { JournalPage } from "./pages/JournalPage";
import { PrivacyPage, TermsPage } from "./pages/LegalPages";
import { NotFound } from "./pages/NotFound";

function LegacyArticle() {
  const { slug } = useParams();
  return <Navigate to={`/noticias/${slug ?? ""}`} replace />;
}

function HashScroll() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const loco = scrollBus.loco;
      const shell = document.getElementById("conteudo");
      if (loco && shell) {
        loco.removeScrollElements(shell);
        loco.addScrollElements(shell);
        loco.resize();
      }
      if (hash) {
        const target = document.getElementById(hash.slice(1));
        if (!target) return;
        if (loco) loco.scrollTo(target, { offset: -12 });
        else target.scrollIntoView();
        return;
      }
      if (loco) loco.scrollTo(0, { immediate: true });
      else window.scrollTo(0, 0);
      ScrollTrigger.refresh();
    }, 40);
    return () => window.clearTimeout(timer);
  }, [pathname, hash]);

  return null;
}

function RouteTransition() {
  const navigate = useNavigate();
  const location = useLocation();
  const reduced = useReduced();
  const transition = useRef<PageTransitionHandle>(null);
  const path = useRef(location.pathname);

  useEffect(() => {
    path.current = location.pathname;
  }, [location.pathname]);

  useEffect(() => {
    if (reduced) return;

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest?.("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
        return;
      }
      if (anchor.target && anchor.target !== "_self") return;
      let url: URL;
      try {
        url = new URL(href, window.location.origin);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (url.pathname === path.current && url.hash) return;
      if (url.pathname === path.current && !url.hash) return;

      event.preventDefault();
      const next = `${url.pathname}${url.search}${url.hash}`;
      transition.current?.run(() => navigate(next));
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [navigate, reduced]);

  if (reduced) return null;
  return <PageTransition ref={transition} />;
}

function Shell() {
  const reduced = useReduced();
  const home = useLocation().pathname === "/";

  return (
    <>
      <SmoothScroll />
      <HashScroll />
      <RouteTransition />
      <Intro />
      <Nav />
      {home && !reduced ? (
        <BerryGuard>
          <BerryCanvas />
        </BerryGuard>
      ) : null}
      <main id="conteudo" className="page-shell">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/sobre" element={<AboutPage />} />
          <Route path="/consorcio" element={<ConsortiumPage />} />
          <Route path="/noticias" element={<JournalPage />} />
          <Route path="/noticias/:slug" element={<ArticlePage />} />
          <Route path="/privacidade" element={<PrivacyPage />} />
          <Route path="/termos" element={<TermsPage />} />
          <Route path="/jornal" element={<Navigate to="/noticias" replace />} />
          <Route path="/jornal/:slug" element={<LegacyArticle />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Shell />
    </BrowserRouter>
  );
}
