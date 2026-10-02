import { useEffect, useState } from "react";
import { Link } from "react-router";

const links = [
  { to: "/consorcio", label: "Consórcio" },
  { to: "/noticias", label: "Notícias" },
];

export function Nav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <a className="skip" href="#conteudo">
        Saltar para o conteúdo
      </a>
      <header
        className="fade-up pointer-events-none fixed inset-x-0 top-4 z-40 flex justify-center px-3"
        data-arrive=""
        data-arrive-hero=""
        style={{ transitionDelay: "0s" }}
      >
        <nav className="site-nav pointer-events-auto flex h-14 max-w-full items-center gap-0.5 rounded-full border border-ink/15 bg-foam px-1.5 text-ink">
          <Link
            to="/"
            className="site-nav__brand"
            onClick={() => setOpen(false)}
          >
            UNEDO4ALL
          </Link>
          <div className="hidden items-center min-[960px]:flex">
            {links.map((link) => (
              <Link key={link.to} to={link.to} className="site-nav__link">
                <span className="site-nav__link-bg" aria-hidden="true" />
                <span className="site-nav__link-label">{link.label}</span>
              </Link>
            ))}
          </div>
          <button
            type="button"
            className="site-nav__toggle relative grid size-11 place-items-center rounded-full min-[960px]:hidden"
            aria-expanded={open}
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            onClick={() => setOpen((value) => !value)}
          >
            <span
              className={`absolute h-[2px] w-4 bg-ink transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${open ? "translate-y-0 rotate-45" : "-translate-y-[4px]"}`}
            />
            <span
              className={`absolute h-[2px] w-4 bg-ink transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${open ? "translate-y-0 -rotate-45" : "translate-y-[4px]"}`}
            />
          </button>
        </nav>
      </header>
      {open ? (
        <div className="fixed inset-0 z-30 bg-ink text-foam">
          <nav className="flex min-h-[100dvh] flex-col justify-end gap-1 px-6 pt-24 pb-12">
            {links.map((link, index) => (
              <Link
                key={link.to}
                to={link.to}
                className="menu-link font-display text-[clamp(2.6rem,12vw,4.6rem)] leading-[1.05] tracking-[-0.03em]"
                style={{ animationDelay: `${index * 70}ms` }}
                onClick={() => setOpen(false)}
              >
                <span className="menu-link__text">{link.label}</span>
              </Link>
            ))}
          </nav>
        </div>
      ) : null}
    </>
  );
}
