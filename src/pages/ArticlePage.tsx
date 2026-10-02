import { Link, useParams } from "react-router";
import { getPost, posts } from "../data";
import { ParallaxMedia } from "../components/Parallax";
import { FadeUp, SplitText, useArrive } from "../components/Reveal";
import { usePage } from "../useReduced";
import { NotFound } from "./NotFound";

export function ArticlePage() {
  const { slug } = useParams();
  const post = slug ? getPost(slug) : undefined;
  const index = posts.findIndex((item) => item.slug === slug);
  const next = index >= 0 ? posts[(index + 1) % posts.length] : undefined;

  usePage(
    post ? `${post.title} · Medronho` : "Texto não encontrado · Medronho",
    post?.excerpt,
  );
  useArrive();

  if (!post) return <NotFound />;

  return (
    <article className="bg-butter px-5 pt-28 pb-24 text-ink md:px-10 md:pt-36 md:pb-32">
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
          {post.author}, {post.house}
        </FadeUp>
        <FadeUp as="p" className="mt-1 text-ink-soft" delay={0.24} hero>
          {post.date}
        </FadeUp>
        <FadeUp className="mt-8" delay={0.1}>
          <ParallaxMedia
            src={post.image}
            alt={post.alt}
            className="aspect-[4/5] w-full overflow-hidden rounded-[1.25rem] sm:aspect-[16/10]"
            strength={14}
          />
        </FadeUp>
        <div className="mt-10 grid max-w-[65ch] gap-6 text-lg leading-relaxed">
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
