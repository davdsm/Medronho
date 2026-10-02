import { Link } from "react-router";
import { NewsCarousel } from "../components/NewsCarousel";
import { PartnerLogos } from "../components/PartnerLogos";
import { Pill } from "../components/Pill";
import { FadeUp, SplitText, useArrive } from "../components/Reveal";
import { Story } from "../components/Story";
import {
  breadcrumbJsonLd,
  getSiteUrl,
  organizationJsonLd,
  SITE,
  useSeo,
  websiteJsonLd,
} from "../seo";

export function HomePage() {
  const origin = getSiteUrl();
  useSeo({
    title: SITE.titleDefault,
    description: SITE.description,
    path: "/",
    jsonLd: [
      organizationJsonLd(origin),
      websiteJsonLd(origin),
      {
        "@type": "WebPage",
        "@id": `${origin}/#webpage`,
        url: `${origin}/`,
        name: SITE.titleDefault,
        description: SITE.description,
        isPartOf: { "@id": `${origin}/#website` },
        about: { "@id": `${origin}/#organization` },
        inLanguage: SITE.language,
        primaryImageOfPage: {
          "@type": "ImageObject",
          url: `${origin}${SITE.ogImagePath}`,
          width: 1200,
          height: 630,
        },
      },
      breadcrumbJsonLd([{ name: "Início", path: "/" }], origin),
    ],
  });
  useArrive();

  return (
    <>
      <Story />

      <section id="sobre" className="bg-foam px-5 py-20 text-ink md:px-10 md:py-28">
        <div className="mx-auto grid max-w-[1100px] gap-8 md:grid-cols-12 md:items-end">
          <FadeUp className="md:col-span-5">
            <SplitText
              as="h2"
              text="O consórcio"
              mode="words"
              className="font-display text-[clamp(2.2rem,5vw,4rem)] leading-[1.05] tracking-[-0.03em]"
            />
          </FadeUp>
          <FadeUp className="md:col-span-7" delay={0.12}>
            <p className="max-w-[46ch] text-lg leading-relaxed">
              O UNEDO4ALL reúne nove empresas, maioritariamente do Centro do país, para estudar e desenvolver novos processos de conservação e valorização do medronho no setor alimentar.
            </p>
            <div className="mt-6">
              <Pill to="/consorcio">Sobre o consórcio</Pill>
            </div>
          </FadeUp>
        </div>
      </section>

      <section className="bg-ink px-5 py-20 text-foam md:px-10 md:py-28">
        <div className="mx-auto max-w-[1400px]">
          <FadeUp>
            <PartnerLogos />
          </FadeUp>
        </div>
      </section>

      <section className="overflow-hidden bg-wine py-20 text-foam md:py-28">
        <div className="news-edge mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <FadeUp>
            <SplitText
              as="h2"
              text="Notícias"
              mode="words"
              className="font-display text-[clamp(2.2rem,5vw,4rem)] leading-[1.05] tracking-[-0.03em]"
            />
          </FadeUp>
          <FadeUp delay={0.1}>
            <Link to="/noticias" className="w-fit text-lg font-medium underline decoration-foam/40 underline-offset-4">
              Ver todas
            </Link>
          </FadeUp>
        </div>
        <FadeUp delay={0.08}>
          <NewsCarousel />
        </FadeUp>
      </section>
    </>
  );
}
