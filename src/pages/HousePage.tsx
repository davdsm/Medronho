import { Link, useParams } from "react-router";
import { getHouse } from "../data";
import { usePage } from "../useReduced";
import { NotFound } from "./NotFound";

export function HousePage() {
  const { slug } = useParams();
  const house = slug ? getHouse(slug) : undefined;

  usePage(house ? `${house.name} · Medronho` : "Casa não encontrada · Medronho", house?.line);

  if (!house) return <NotFound />;

  return (
    <article className="bg-butter px-5 pt-28 pb-24 text-ink md:px-10 md:pt-36">
      <div className="mx-auto grid max-w-[1200px] gap-8 lg:grid-cols-12 lg:items-start lg:gap-12">
        <header className="lg:sticky lg:top-28 lg:col-span-5">
          <p className="text-sm text-ink-soft">
            <Link to="/#casas" className="underline decoration-ink/30 underline-offset-4">
              Casas
            </Link>
          </p>
          <h1 className="page-in mt-4 max-w-[12ch] font-display text-[clamp(3rem,7vw,5.4rem)] leading-[0.95] tracking-[-0.03em]">
            {house.name}
          </h1>
          <p className="mt-4 text-lg">
            {house.role}. {house.place}.
          </p>
        </header>
        <div className="lg:col-span-7">
          <img
            src={house.image}
            alt={house.alt}
            className="aspect-[4/5] w-full rounded-[1.25rem] object-cover sm:aspect-[4/3]"
          />
          <div className="mt-8 grid max-w-[65ch] gap-6 text-lg leading-relaxed">
            {house.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}
