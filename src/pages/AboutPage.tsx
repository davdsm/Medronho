import { FadeUp, SplitText, useArrive } from "../components/Reveal";
import { Pill } from "../components/Pill";
import { withSpecies } from "../components/Species";
import { useList, useText } from "../content";
import { breadcrumbJsonLd, organizationJsonLd, useSeo, websiteJsonLd } from "../seo";

const projectName =
  "UNEDO4ALL — Estratégias inovadoras para conservação e valorização integral do Medronho na indústria alimentar";

export function AboutPage() {
  const subtitle = useText("about.subtitle");
  const projectCopy = useList("about.paragraphs");
  const objectives = useList("about.objectives");
  const operation = [
    { label: "Código da operação", value: useText("about.operation.code") },
    { label: "Promotor", value: useText("about.operation.promoter") },
    { label: "Custo total", value: useText("about.operation.total") },
    { label: "Apoio financeiro da UE", value: useText("about.operation.support") },
    { label: "Taxa de cofinanciamento", value: useText("about.operation.rate") },
  ];
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
          {withSpecies(subtitle)}
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
