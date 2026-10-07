import { FadeUp, SplitText, useArrive } from "../components/Reveal";
import { Pill } from "../components/Pill";
import { Species, withSpecies } from "../components/Species";
import { breadcrumbJsonLd, organizationJsonLd, useSeo, websiteJsonLd } from "../seo";

const projectName =
  "UNEDO4ALL — Estratégias inovadoras para conservação e valorização integral do Medronho na indústria alimentar";

const projectCopy = [
  "O projeto UNEDO4ALL tem como principal objetivo estudar e desenvolver novos processos para conservação e valorização do medronho (Arbutus unedo), visando ampliar significativamente a sua utilização no setor alimentar de forma sustentável. O projeto prevê atividades de investigação industrial e desenvolvimento experimental que visam desenvolver processos inovadores para conservação do fruto fresco e permitir a sua colocação no mercado de frutos vermelhos de inverno; bem como processos inovadores para extração de compostos bioativos e seleção de novas estirpes fermentadoras da microbiota do medronho, visando o desenvolvimento sustentável de diferentes tipologias de produtos alimentares à base de medronho.",
  "Os resultados esperados incluem novos produtos diferenciados, como preparados de medronho para pastelaria, concentrado e sumo de medronho, fermentado não alcoólico e desidratado de medronho e de kombucha de medronho. A estratégia de disseminação do projeto integra ações como participação em feiras e conferências, criação de um website, publicação de resultados técnicos e científicos e demonstrações gastronómicas, visando fortalecer a valorização do medronho e impulsionar o seu reconhecimento nos mercados-alvo.",
];

// Objetivos conforme a Ficha de Operação; substituir pelos objetivos específicos do anexo técnico (pág. 5).
const objectives = [
  "Desenvolver processos inovadores para conservação do fruto fresco do medronho;",
  "Desenvolver processos inovadores de extração de compostos bioativos;",
  "Selecionar novas estirpes fermentadoras da microbiota do medronho;",
  "Desenvolver, de forma sustentável, diferentes tipologias de produtos alimentares à base de medronho: preparados para pastelaria, concentrado e sumo, fermentado não alcoólico e desidratados, incluindo kombucha desidratada.",
];

const operation = [
  { label: "Código da operação", value: "COMPETE2030-FEDER-02044600" },
  { label: "Promotor", value: "Decorgel - Produtos Alimentares, S.A." },
  { label: "Custo total", value: "1.100.731,53 €" },
  { label: "Apoio financeiro da UE", value: "895.555,69 €" },
  { label: "Taxa de cofinanciamento", value: "81%" },
];

export function AboutPage() {
  useSeo({
    title: "Sobre o projeto",
    description:
      "Conheça o projeto UNEDO4ALL: objetivos, resultados esperados e ficha de operação do projeto de conservação e valorização integral do medronho na indústria alimentar.",
    path: "/sobre",
    jsonLd: [
      organizationJsonLd(),
      websiteJsonLd(),
      {
        "@type": "AboutPage",
        name: "Sobre o projeto UNEDO4ALL",
        description: projectName,
        url: "/sobre",
      },
      breadcrumbJsonLd([
        { name: "Início", path: "/" },
        { name: "Sobre", path: "/sobre" },
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
            text="Sobre o projeto"
            mode="words"
            hero
            className="max-w-[14ch] font-display text-[clamp(3rem,7vw,5.4rem)] leading-[0.95] tracking-[-0.03em]"
          />
        </FadeUp>
        <FadeUp as="p" className="mt-5 max-w-[48ch] text-lg text-ink-soft" delay={0.1} hero>
          Estratégias inovadoras para conservação e valorização integral do <Species /> na indústria alimentar.
        </FadeUp>

        <div className="mt-8 grid max-w-[68ch] gap-5 text-lg leading-relaxed">
          {projectCopy.map((paragraph, index) => (
            <FadeUp as="p" key={paragraph.slice(0, 24)} delay={0.15 + index * 0.1} hero={index === 0}>
              {withSpecies(paragraph)}
            </FadeUp>
          ))}
        </div>

        <FadeUp className="mt-16">
          <SplitText
            as="h2"
            text="Objetivos"
            mode="words"
            className="font-display text-[clamp(2rem,4vw,3.2rem)] leading-[1.05] tracking-[-0.03em]"
          />
        </FadeUp>
        <FadeUp as="div" className="mt-6 max-w-[68ch]" delay={0.08}>
          <ul className="grid list-disc gap-3 pl-5 text-lg leading-relaxed marker:text-ink-soft">
            {objectives.map((objective) => (
              <li key={objective}>{objective}</li>
            ))}
          </ul>
        </FadeUp>

        <FadeUp className="mt-16">
          <SplitText
            as="h2"
            text="Ficha de operação"
            mode="words"
            className="font-display text-[clamp(2rem,4vw,3.2rem)] leading-[1.05] tracking-[-0.03em]"
          />
        </FadeUp>
        <dl className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {operation.map((item, index) => (
            <FadeUp key={item.label} delay={0.06 * index}>
              <div className="h-full rounded-[1.4rem] bg-foam px-5 py-6">
                <dt className="text-sm text-ink-soft">{item.label}</dt>
                <dd className="mt-2 font-display text-xl leading-tight tracking-[-0.03em] break-words">
                  {item.value}
                </dd>
              </div>
            </FadeUp>
          ))}
        </dl>
        <FadeUp className="mt-8" delay={0.1}>
          <Pill href="/documentos/ficha-de-operacao-unedo4all.pdf">Ver a Ficha de Operação (PDF)</Pill>
        </FadeUp>
      </div>
    </div>
  );
}
