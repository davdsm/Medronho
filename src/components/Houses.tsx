import { useEffect, useRef } from "react";
import { Link } from "react-router";
import { houses } from "../data";
import { gsap } from "../gsap";
import { useReduced } from "../useReduced";

export function Houses() {
  const reduced = useReduced();
  const wrap = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reduced) return;
    const mm = gsap.matchMedia();
    mm.add("(min-width: 1024px)", () => {
      const row = track.current;
      const pin = wrap.current;
      if (!row || !pin) return;
      const distance = () => Math.max(row.scrollWidth - window.innerWidth, 1);
      gsap.to(row, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: pin,
          start: "top top",
          end: () => `+=${distance()}`,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
        },
      });
    });
    return () => mm.revert();
  }, [reduced]);

  return (
    <section id="casas" className="bg-foam text-ink">
      <div className="mx-auto max-w-[1400px] px-5 pt-24 pb-8 md:px-10 md:pt-32">
        <h2 className="max-w-[12ch] font-display text-[clamp(2.6rem,6vw,5.5rem)] leading-[1.02] tracking-[-0.03em]">
          Cinco casas, uma caixa.
        </h2>
        <p className="mt-5 max-w-[42ch] text-lg leading-relaxed text-ink-soft">
          Cada casa faz a sua parte. À quinta-feira a caixa passa por todas.
        </p>
      </div>
      <div
        ref={wrap}
        className="overflow-x-auto snap-x snap-mandatory md:overflow-visible lg:overflow-hidden"
        data-lenis-prevent-touch
      >
        <div
          ref={track}
          className="flex w-max items-stretch gap-4 px-4 pb-16 md:grid md:w-full md:grid-cols-2 md:gap-x-6 md:gap-y-12 md:px-10 md:pb-24 lg:flex lg:h-[100dvh] lg:w-max lg:items-center lg:gap-5 lg:px-[6vw] lg:pb-0"
        >
          {houses.map((house) => (
            <Link
              key={house.slug}
              to={`/casas/${house.slug}`}
              className="w-[min(86vw,26rem)] shrink-0 snap-start md:w-auto md:min-w-0 lg:w-[46vw] lg:shrink-0"
            >
              <div className="zoom-frame overflow-hidden rounded-[1.25rem] bg-ink/5">
                <img
                  src={house.image}
                  alt={house.alt}
                  className="zoom-img aspect-[4/5] w-full object-cover md:aspect-[4/3] lg:aspect-[5/4]"
                  loading="lazy"
                />
              </div>
              <h3 className="mt-5 font-display text-[clamp(2rem,3vw,3.2rem)] leading-[1.05] tracking-[-0.03em]">
                {house.name}
              </h3>
              <p className="mt-2 max-w-[36ch] text-lg text-ink-soft">{house.line}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
