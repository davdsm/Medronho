import { Link, useParams } from "react-router";
import { usePosts } from "../content";
import { formatDate } from "../lib/types";
import { ParallaxMedia } from "../components/Parallax";
import { FadeUp, SplitText, useArrive } from "../components/Reveal";
import {
  breadcrumbJsonLd,
  getSiteUrl,
  organizationJsonLd,
  useSeo,
  websiteJsonLd,
} from "../seo";
import { NotFound } from "./NotFound";

export function ArticlePage() {
  const { slug } = useParams();
  const { posts } = usePosts();
  const post = slug ? posts.find((item) => item.slug === slug) : undefined;
  const index = posts.findIndex((item) => item.slug === slug);
  const next = index >= 0 && posts.length > 1 ? posts[(index + 1) % posts.length] : undefined;
  const path = post ? `/noticias/${post.slug}` : "/noticias";
  const published = post?.publishedAt;
  const modified = post?.updatedAt;
  const origin = getSiteUrl();

  useSeo(
    post
      ? {
          title: post.title,
          description: post.excerpt,
          path,
          type: "article",
          publishedTime: published,
          modifiedTime: modified,
          author: post.author,
          section: "Notícias",
          jsonLd: [
            organizationJsonLd(origin),
            websiteJsonLd(origin),
            {
              "@type": "NewsArticle",
              headline: post.title,
              description: post.excerpt,
              image: [`${origin}${post.image}`],
              datePublished: published,
              dateModified: modified,
              author: {
                "@type": "Person",
                name: post.author,
              },
              publisher: { "@id": `${origin}/#organization` },
              mainEntityOfPage: `${origin}${path}`,
              articleSection: post.category,
              inLanguage: "pt-PT",
            },
            breadcrumbJsonLd(
              [
                { name: "Início", path: "/" },
                { name: "Notícias", path: "/noticias" },
                { name: post.title, path },
              ],
              origin,
            ),
          ],
        }
      : {
          title: "Texto não encontrado",
          description: "Este artigo não existe no website UNEDO4ALL.",
          path,
          noindex: true,
        },
  );
  useArrive();

  if (!post) return <NotFound />;

  return (
    <article
      className="bg-butter px-5 pt-28 pb-24 text-ink md:px-10 md:pt-36 md:pb-32"
      itemScope
      itemType="https://schema.org/NewsArticle"
    >
      <div className="mx-auto max-w-[820px]">
        <FadeUp as="p" className="text-sm text-ink-soft" hero>
          <Link to="/noticias" className="underline decoration-ink/30 underline-offset-4">
            Notícias
          </Link>
        </FadeUp>
        <FadeUp className="mt-4" hero>
          <SplitText
            as="h1"
            text={post.title}
            mode="words"
            hero
            className="font-display text-[clamp(2.6rem,6vw,5rem)] leading-[1.02] tracking-[-0.03em]"
          />
        </FadeUp>
        <FadeUp as="p" className="mt-4 text-lg text-ink-soft" delay={0.18} hero>
          <span itemProp="author">{post.author}</span>, {post.category}
        </FadeUp>
        <FadeUp as="p" className="mt-1 text-ink-soft" delay={0.24} hero>
          <time dateTime={published} itemProp="datePublished">
            {formatDate(post.publishedAt)}
          </time>
        </FadeUp>
        <FadeUp className="mt-8" delay={0.1}>
          <ParallaxMedia
            src={post.image}
            alt={post.imageAlt}
            className="aspect-[4/5] w-full overflow-hidden rounded-[1.25rem] sm:aspect-[16/10]"
            strength={14}
          />
        </FadeUp>
        <div className="mt-10 grid max-w-[65ch] gap-6 text-lg leading-relaxed" itemProp="articleBody">
          {post.body.map((paragraph, i) => (
            <FadeUp as="p" key={paragraph.slice(0, 24)} delay={0.06 * i}>
              {paragraph}
            </FadeUp>
          ))}
        </div>
        {next ? (
          <FadeUp className="mt-16 border-t border-ink/15 pt-8">
            <Link
              to={`/noticias/${next.slug}`}
              className="font-display text-[clamp(1.6rem,3vw,2.4rem)] leading-[1.1] tracking-[-0.03em] underline decoration-ink/25 underline-offset-4"
            >
              A seguir: {next.title}
            </Link>
          </FadeUp>
        ) : null}
      </div>
    </article>
  );
}
