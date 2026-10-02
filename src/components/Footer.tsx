import { Link } from "react-router";

export function Footer() {
  return (
    <footer className="bg-wine text-foam">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-8 px-5 pt-16 md:flex-row md:items-end md:justify-between md:px-10">
        <div>
          <p className="font-display text-2xl tracking-[-0.03em]">UNEDO4ALL</p>
          <p className="mt-3 max-w-[36ch] text-foam-soft">
            Nove empresas a estudar e valorizar o medronho, maioritariamente no Centro do país.
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-5 gap-y-2 text-[15px] font-medium">
          <Link to="/" className="hover:text-butter">
            Início
          </Link>
          <Link to="/consorcio" className="hover:text-butter">
            Consórcio
          </Link>
          <Link to="/noticias" className="hover:text-butter">
            Notícias
          </Link>
          <Link to="/privacidade" className="hover:text-butter">
            Privacidade
          </Link>
          <Link to="/termos" className="hover:text-butter">
            Termos
          </Link>
        </nav>
      </div>
      <p className="mx-auto max-w-[1400px] px-5 pt-10 text-sm text-foam-soft md:px-10">
        2026 UNEDO4ALL ·{" "}
        <Link to="/privacidade" className="underline decoration-foam/30 underline-offset-4 hover:text-butter">
          Política de Privacidade
        </Link>
        {" · "}
        <Link to="/termos" className="underline decoration-foam/30 underline-offset-4 hover:text-butter">
          Termos e Condições
        </Link>
      </p>
      <div className="mt-6 overflow-hidden leading-none" aria-hidden="true">
        <p className="translate-y-[0.12em] font-display text-[14vw] leading-[0.75] tracking-[-0.04em] text-butter md:text-[12vw]">
          UNEDO4ALL
        </p>
      </div>
    </footer>
  );
}
