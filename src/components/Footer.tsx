import { Link } from "react-router";

export function Footer() {
  return (
    <footer className="bg-wine text-foam">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-8 px-5 pt-16 md:flex-row md:items-end md:justify-between md:px-10">
        <div>
          <p className="font-display text-2xl tracking-[-0.03em]">medronho</p>
          <p className="mt-3 max-w-[36ch] text-foam-soft">
            Cinco casas no Barrocal, no Algarve, a tratar do medronho em conjunto.
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
        </nav>
      </div>
      <p className="mx-auto max-w-[1400px] px-5 pt-10 text-sm text-foam-soft md:px-10">
        2026 Consórcio Medronho
      </p>
      <div className="mt-6 overflow-hidden leading-none" aria-hidden="true">
        <p className="translate-y-[0.12em] font-display text-[22vw] leading-[0.75] tracking-[-0.04em] text-butter">
          medronho
        </p>
      </div>
    </footer>
  );
}
