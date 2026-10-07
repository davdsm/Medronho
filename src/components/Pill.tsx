import { ArrowUpRight } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { Link } from "react-router";

const shell = {
  ink: "bg-ink text-butter",
  butter: "bg-butter text-ink",
  ghost: "border border-ink bg-transparent text-ink",
} as const;

const nub = {
  ink: "bg-butter text-ink",
  butter: "bg-ink text-butter",
  ghost: "bg-ink text-butter",
} as const;

type Tone = keyof typeof shell;

export function Pill({
  children,
  tone = "ink",
  to,
  href,
}: {
  children: ReactNode;
  tone?: Tone;
  to?: string;
  /** Ligação externa (abre num novo separador). */
  href?: string;
}) {
  const className = `group inline-flex items-center gap-3 rounded-full py-1.5 pr-1.5 pl-5 text-[15px] font-semibold whitespace-nowrap transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] ${shell[tone]}`;
  const content = (
    <>
      {children}
      <span
        className={`grid size-8 place-items-center rounded-full transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-px ${nub[tone]}`}
      >
        <ArrowUpRight size={16} weight="bold" aria-hidden="true" />
      </span>
    </>
  );
  if (href) {
    return (
      <a href={href} className={className} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    );
  }
  return (
    <Link to={to ?? "/"} className={className}>
      {content}
    </Link>
  );
}
