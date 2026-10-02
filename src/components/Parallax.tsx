import { useLayoutEffect, useRef, type ReactNode } from "react";
import { gsap } from "../gsap";
import { useReduced } from "../useReduced";

/** Vertical parallax: the media moves slower than the scroll. */
export function ParallaxMedia({
  src,
  alt,
  className = "",
  strength = 24,
}: {
  src: string;
  alt: string;
  className?: string;
  strength?: number;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const media = useRef<HTMLImageElement>(null);
  const reduced = useReduced();

  useLayoutEffect(() => {
    if (reduced) return;
    const frameEl = frame.current;
    const mediaEl = media.current;
    if (!frameEl || !mediaEl) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        mediaEl,
        { yPercent: -strength },
        {
          yPercent: strength,
          ease: "none",
          scrollTrigger: {
            trigger: frameEl,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        },
      );
    }, frameEl);

    return () => ctx.revert();
  }, [reduced, strength]);

  return (
    <div ref={frame} className={`parallax-frame ${className}`}>
      <img ref={media} src={src} alt={alt} className="parallax-media" loading="lazy" draggable={false} />
    </div>
  );
}

/** Full-bleed sticky section with a parallax background image. */
export function ParallaxBeat({
  image,
  alt,
  children,
  reduced,
}: {
  image: string;
  alt: string;
  children: ReactNode;
  reduced: boolean;
}) {
  const article = useRef<HTMLElement>(null);
  const bg = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (reduced) return;
    const el = article.current;
    const layer = bg.current;
    if (!el || !layer) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        layer,
        { yPercent: -18 },
        {
          yPercent: 18,
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        },
      );
    }, el);

    return () => ctx.revert();
  }, [reduced]);

  return (
    <article
      ref={article}
      className={`beat-card ${
        reduced ? "relative py-24" : "stack-card sticky top-0 min-h-[100dvh]"
      }`}
    >
      <div ref={bg} className="beat-card__bg" style={{ backgroundImage: `url(${image})` }} aria-hidden="true" />
      <img src={image} alt={alt} className="sr-only" />
      <div className="relative z-10 flex min-h-[inherit] items-end px-5 pb-16 md:px-10 md:pb-24">
        {children}
      </div>
    </article>
  );
}
