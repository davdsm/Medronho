import { partners } from "../data";
import { PartnerLogos } from "../components/PartnerLogos";
import { FadeUp, SplitText, useArrive } from "../components/Reveal";
import { breadcrumbJsonLd, organizationJsonLd, useSeo, websiteJsonLd } from "../seo";

const facts = [
  { label: "Empresas", value: "9" },
  { label: "Onde", value: "Maioritariamente no Centro" },
  { label: "Fruto", value: "Arbutus unedo" },
  { label: "Foco", value: "Conservação e valorização" },
];

const projectCopy = [
  "O projeto UNEDO4ALL tem como principal objetivo estudar e desenvolver novos processos para conservação e valorização do medronho (Arbutus unedo), visando ampliar significativamente a sua utilização no setor alimentar de forma sustentável. O projeto prevê atividades de investigação industrial e desenvolvimento experimental que visam desenvolver processos inovadores para conservação do fruto fresco e permitir a sua colocação no mercado de frutos vermelhos de inverno; bem como processos inovadores para extração de compostos bioativos e seleção de novas estirpes fermentadoras da microbiota do medronho, visando o desenvolvimento sustentável de diferentes tipologias de produtos alimentares à base de medronho.",
  "Os resultados esperados incluem novos produtos diferenciados, como preparados de medronho para pastelaria, concentrado e sumo de medronho, fermentado não alcoólico e desidratado de medronho e de kombucha de medronho. A estratégia de disseminação do projeto integra ações como participação em feiras e conferências, criação de um website, publicação de resultados técnicos e científicos e demonstrações gastronómicas, visando fortalecer a valorização do medronho e impulsionar o seu reconhecimento nos mercados-alvo.",
];

export function ConsortiumPage() {
  useSeo({
    title: "O consórcio",
    description:
      "O UNEDO4ALL reúne nove empresas para estudar e desenvolver novos processos de conservação e valorização do medronho (Arbutus unedo) no setor alimentar.",
    path: "/consorcio",
    jsonLd: [
      organizationJsonLd(),
      websiteJsonLd(),
      {
        "@type": "AboutPage",
        name: "O consórcio UNEDO4ALL",
        description:
          "Consórcio de empresas portuguesas focado na conservação e valorização do medronho.",
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
          Nove empresas, maioritariamente do Centro do país.
        </FadeUp>
        <div className="mt-8 grid max-w-[68ch] gap-5 text-lg leading-relaxed">
          {projectCopy.map((paragraph, index) => (
            <FadeUp as="p" key={paragraph.slice(0, 24)} delay={0.15 + index * 0.1} hero={index === 0}>
              {paragraph}
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
            text="As empresas"
            mode="words"
            className="font-display text-[clamp(2rem,4vw,3.2rem)] leading-[1.05] tracking-[-0.03em]"
          />
        </FadeUp>
        <ul className="mt-8 border-t border-ink/15">
          {partners.map((partner, index) => (
            <FadeUp
              as="li"
              key={partner.logo}
              delay={index * 0.05}
              className="border-b border-ink/15 py-5"
            >
              <p className="font-display text-xl tracking-[-0.03em] md:text-2xl">{partner.name}</p>
            </FadeUp>
          ))}
        </ul>
      </div>

      <FadeUp className="mx-auto mt-16 max-w-[1400px] overflow-hidden rounded-[1.75rem] bg-ink px-6 py-12 md:px-12 md:py-16">
        <PartnerLogos />
      </FadeUp>
    </div>
  );
}
