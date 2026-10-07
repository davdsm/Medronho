import type { ReactNode } from "react";
import { partners } from "../data";
import { PartnerLogos } from "../components/PartnerLogos";
import { FadeUp, SplitText, useArrive } from "../components/Reveal";
import { Species, withSpecies } from "../components/Species";
import { useList, useText } from "../content";
import { breadcrumbJsonLd, organizationJsonLd, useSeo, websiteJsonLd } from "../seo";

const facts: { label: string; value: ReactNode }[] = [
  { label: "Copromotores", value: "8" },
  { label: "Onde", value: "Maioritariamente no Centro" },
  { label: "Fruto", value: <Species /> },
  { label: "Foco", value: "Conservação e valorização" },
];

const groups = [
  {
    title: "Entidades do Sistema Nacional de Investigação e Inovação (ENESII)",
    kind: "enesii",
  },
  { title: "Empresas", kind: "empresa" },
] as const;

export function ConsortiumPage() {
  const subtitle = useText("consortium.subtitle");
  const projectCopy = useList("consortium.paragraphs");
  useSeo({
    title: "O consórcio",
    description:
      "O consórcio UNEDO4ALL reúne oito copromotores — quatro entidades do sistema científico e quatro empresas — para conservar e valorizar o medronho (Arbutus unedo) no setor alimentar.",
    path: "/consorcio",
    jsonLd: [
      organizationJsonLd(),
      websiteJsonLd(),
      {
        "@type": "AboutPage",
        name: "O consórcio UNEDO4ALL",
        description:
          "Consórcio de oito copromotores portugueses focado na conservação e valorização do medronho.",
        url: "/consorcio",
      },
      breadcrumbJsonLd([
        { name: "Início", path: "/" },
        { name: "Consórcio", path: "/consorcio" },
      ]),
    ],
  });
  useArrive();

  return (
    <div className="bg-butter px-5 pt-28 pb-24 text-ink md:px-10 md:pt-36 md:pb-32">
      <div className="mx-auto max-w-[1100px]">
        <FadeUp hero>
          <SplitText
            as="h1"
            text="O consórcio"
            mode="words"
            hero
            className="max-w-[12ch] font-display text-[clamp(3rem,7vw,5.4rem)] leading-[0.95] tracking-[-0.03em]"
          />
        </FadeUp>
        <FadeUp as="p" className="mt-5 text-lg text-ink-soft" delay={0.1} hero>
          {withSpecies(subtitle)}
        </FadeUp>
        <div className="mt-8 grid max-w-[68ch] gap-5 text-lg leading-relaxed">
          {projectCopy.map((paragraph, index) => (
            <FadeUp as="p" key={paragraph.slice(0, 24)} delay={0.15 + index * 0.1} hero={index === 0}>
              {withSpecies(paragraph)}
            </FadeUp>
          ))}
        </div>

        <dl className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {facts.map((fact, index) => (
            <FadeUp key={fact.label} delay={0.08 * index}>
              <div className="rounded-[1.4rem] bg-foam px-5 py-6">
                <dt className="text-sm text-ink-soft">{fact.label}</dt>
                <dd className="mt-2 font-display text-2xl leading-tight tracking-[-0.03em]">{fact.value}</dd>
              </div>
            </FadeUp>
          ))}
        </dl>

        <FadeUp className="mt-16">
          <SplitText
            as="h2"
            text="Os copromotores"
            mode="words"
            className="font-display text-[clamp(2rem,4vw,3.2rem)] leading-[1.05] tracking-[-0.03em]"
          />
        </FadeUp>
        {groups.map((group) => (
          <section key={group.kind} className="mt-10" aria-label={group.title}>
            <FadeUp as="p" className="text-sm font-semibold tracking-wide text-ink-soft uppercase">
              {group.title}
            </FadeUp>
            <ul className="mt-4 border-t border-ink/15">
              {partners
                .filter((partner) => partner.kind === group.kind)
                .map((partner, index) => (
                  <FadeUp
                    as="li"
                    key={partner.logo}
                    delay={index * 0.05}
                    className="border-b border-ink/15"
                  >
                    <a
                      href={partner.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center justify-between gap-4 py-5 font-display text-xl tracking-[-0.03em] underline decoration-ink/0 underline-offset-4 transition-[text-decoration-color] duration-300 hover:decoration-ink md:text-2xl"
                    >
                      <span>{partner.name}</span>
                      <span className="sr-only"> (abre num novo separador)</span>
                      <span aria-hidden="true" className="text-ink-soft transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                        ↗
                      </span>
                    </a>
                  </FadeUp>
                ))}
            </ul>
          </section>
        ))}
      </div>

      <FadeUp className="mx-auto mt-16 max-w-[1400px] overflow-hidden rounded-[1.75rem] bg-ink px-6 py-12 md:px-12 md:py-16">
        <PartnerLogos />
      </FadeUp>
    </div>
  );
}
