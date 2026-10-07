import { Link } from "react-router";
import { usePosts, useText } from "../content";
import { formatDate } from "../lib/types";
import { ParallaxMedia } from "../components/Parallax";
import { FadeUp, SplitText, useArrive } from "../components/Reveal";
import { breadcrumbJsonLd, organizationJsonLd, useSeo, websiteJsonLd } from "../seo";

export function JournalPage() {
  const { posts } = usePosts();
  const intro = useText("news.intro");
  useSeo({
    title: "Notícias",
    description:
      "Notícias do projeto UNEDO4ALL sobre a colheita, conservação e valorização do medronho no setor alimentar.",
    path: "/noticias",
    jsonLd: [
      organizationJsonLd(),
      websiteJsonLd(),
      {
        "@type": "CollectionPage",
        name: "Notícias UNEDO4ALL",
        description:
          "Artigos e atualizações sobre o medronho, a colheita e o trabalho do consórcio.",
      },
      breadcrumbJsonLd([
        { name: "Início", path: "/" },
        { name: "Notícias", path: "/noticias" },
      ]),
    ],
  });
  useArrive();

  const [featured, ...rest] = posts;

  return (
    <div className="bg-butter px-5 pt-28 pb-24 text-ink md:px-10 md:pt-36 md:pb-32">
      <div className="mx-auto max-w-[1400px]">
        <FadeUp hero>
          <SplitText
            as="h1"
            text="Notícias"
            mode="letters"
            hero
            stagger={0.05}
            className="font-display text-[clamp(3.2rem,8vw,6rem)] leading-[0.95] tracking-[-0.03em]"
          />
        </FadeUp>
        <FadeUp as="p" className="mt-5 max-w-[42ch] text-lg leading-relaxed text-ink-soft" delay={0.2} hero>
          {intro}
        </FadeUp>

        {featured ? (
          <FadeUp className="mt-14" delay={0.08}>
            <Link
              to={`/noticias/${featured.slug}`}
              className="group grid gap-6 md:grid-cols-12 md:items-end md:gap-10"
            >
              <ParallaxMedia
                src={featured.image}
                alt={featured.imageAlt}
                className="aspect-[4/5] w-full overflow-hidden rounded-[1.25rem] sm:aspect-[16/9] md:col-span-7"
                strength={16}
              />
              <div className="md:col-span-5">
                <p className="text-sm text-ink-soft">{formatDate(featured.publishedAt)}</p>
                <h2 className="mt-2 font-display text-[clamp(1.9rem,3.4vw,3.2rem)] leading-[1.05] tracking-[-0.03em] text-balance group-hover:underline group-hover:decoration-ink/30 group-hover:underline-offset-4">
                  {featured.title}
                </h2>
                <p className="mt-3 max-w-[42ch] text-lg leading-relaxed">{featured.excerpt}</p>
                <p className="mt-3 text-ink-soft">
                  {featured.author}, {featured.category}
                </p>
              </div>
            </Link>
          </FadeUp>
        ) : null}

        <ul className="mt-14 grid gap-12 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-8 lg:gap-y-14">
          {rest.map((post, index) => (
            <FadeUp as="li" key={post.slug} delay={0.06 + index * 0.05}>
              <Link to={`/noticias/${post.slug}`} className="group flex h-full flex-col gap-4">
                <ParallaxMedia
                  src={post.image}
                  alt={post.imageAlt}
                  className="aspect-[4/3] w-full overflow-hidden rounded-[1.25rem]"
                  strength={14}
                />
                <div className="flex flex-1 flex-col">
                  <p className="text-sm text-ink-soft">{formatDate(post.publishedAt)}</p>
                  <h2 className="mt-2 font-display text-[clamp(1.55rem,2.4vw,2.1rem)] leading-[1.1] tracking-[-0.03em] text-balance group-hover:underline group-hover:decoration-ink/30 group-hover:underline-offset-4">
                    {post.title}
                  </h2>
                  <p className="mt-3 text-base leading-relaxed text-ink-soft md:text-lg">{post.excerpt}</p>
                  <p className="mt-auto pt-3 text-sm text-ink-soft">
                    {post.author}, {post.category}
                  </p>
                </div>
              </Link>
            </FadeUp>
          ))}
        </ul>
      </div>
    </div>
  );
}
