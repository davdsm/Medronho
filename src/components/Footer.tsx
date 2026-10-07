import { Link } from "react-router";

export function Footer() {
  return (
    <footer className="bg-ink text-foam">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-8 px-5 pt-16 md:flex-row md:items-end md:justify-between md:px-10">
        <div>
          <p className="font-display text-2xl tracking-[-0.03em]">UNEDO4ALL</p>
          <p className="mt-3 max-w-[44ch] text-foam-soft">
            Estratégias inovadoras para conservação e valorização integral do Medronho na indústria alimentar
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-5 gap-y-2 text-[15px] font-medium" aria-label="Rodapé">
          <Link to="/" className="hover:text-butter">
            Início
          </Link>
          <Link to="/sobre" className="hover:text-butter">
            Sobre
          </Link>
          <Link to="/consorcio" className="hover:text-butter">
            Consórcio
          </Link>
          <Link to="/noticias" className="hover:text-butter">
            Notícias
          </Link>
        </nav>
      </div>
      <div className="mx-auto max-w-[1400px] px-5 pt-10 md:px-10">
        <div className="rounded-[1.25rem] bg-white px-4 py-3 md:px-8 md:py-4">
          <img
            src="/funding/barra-financiamento.png"
            alt="COMPETE 2030, Portugal 2030 e Cofinanciado pela União Europeia"
            width={1595}
            height={290}
            className="mx-auto h-auto w-full max-w-[620px]"
            loading="lazy"
          />
        </div>
      </div>
      <div className="mx-auto max-w-[1400px] px-5 pt-8 text-sm text-foam-soft md:px-10">
        <p>2026</p>
        <p className="mt-1 flex flex-wrap items-baseline gap-x-3">
          <Link
            to="/privacidade"
            className="underline decoration-foam/30 underline-offset-4 hover:text-butter"
          >
            Política de Privacidade
          </Link>
          <Link
            to="/termos"
            className="underline decoration-foam/30 underline-offset-4 hover:text-butter"
          >
            Termos e Condições
          </Link>
        </p>
      </div>
      <div className="mt-6 overflow-hidden leading-none" aria-hidden="true">
        <p className="translate-y-[0.12em] font-display text-[14vw] leading-[0.75] tracking-[-0.04em] text-butter md:text-[12vw]">
          UNEDO4ALL
        </p>
      </div>
    </footer>
  );
}
