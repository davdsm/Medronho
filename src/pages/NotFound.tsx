import { Link } from "react-router";
import { usePage } from "../useReduced";

export function NotFound() {
  usePage("Página não encontrada · Medronho");

  return (
    <div className="flex min-h-[70dvh] flex-col justify-end bg-butter px-5 pt-32 pb-20 text-ink md:px-10">
      <h1 className="page-in max-w-[12ch] font-display text-[clamp(2.8rem,7vw,5.5rem)] leading-[0.98] tracking-[-0.03em]">
        Esta página não existe.
      </h1>
      <Link
        to="/"
        className="mt-8 w-fit rounded-full bg-ink px-6 py-3 font-semibold text-butter"
      >
        Voltar ao início
      </Link>
    </div>
  );
}
