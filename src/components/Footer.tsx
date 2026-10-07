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
        <ul
          className="flex flex-wrap items-center justify-start gap-x-8 gap-y-5 md:gap-x-12"
          aria-label="Financiamento"
        >
          <li>
            <img
              src="/funding/compete2030-branco.png"
              alt="COMPETE 2030"
              width={460}
              height={260}
              className="h-14 w-auto md:h-20"
              loading="lazy"
            />
          </li>
          <li>
            <img
              src="/funding/portugal2030-branco.png"
              alt="Portugal 2030"
              width={512}
              height={190}
              className="h-10 w-auto md:h-14"
              loading="lazy"
            />
          </li>
          <li>
            <img
              src="/funding/ue-cofinanciado-branco.png"
              alt="Cofinanciado pela União Europeia"
              width={789}
              height={170}
              className="h-9 w-auto md:h-12"
              loading="lazy"
            />
          </li>
        </ul>
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
