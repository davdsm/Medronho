import { houses } from "../data";
import { PartnerLogos } from "../components/PartnerLogos";
import { FadeUp, SplitText, useArrive } from "../components/Reveal";
import { usePage } from "../useReduced";

const facts = [
  { label: "Casas", value: "5" },
  { label: "Onde", value: "Barrocal, Algarve" },
  { label: "Colheita", value: "Outubro a janeiro" },
  { label: "Caixa", value: "Todas as quintas-feiras" },
];

export function ConsortiumPage() {
  usePage(
    "O consórcio · Medronho",
    "Cinco casas no Algarve tratam do medronho em conjunto, da árvore até à mesa.",
  );
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
        <div className="mt-8 grid max-w-[62ch] gap-5 text-lg leading-relaxed">
          <FadeUp as="p" delay={0.15} hero>
            O consórcio junta cinco casas do Barrocal. Umas têm os medronheiros, outras transformam o fruto, outra põe-no no prato. Ninguém vende a sua parte por fora na semana da caixa.
          </FadeUp>
          <FadeUp as="p" delay={0.25} hero>
            À quinta-feira a caixa sai da Ribeira Funda e passa pela Oficina, pela Doçaria e pela Mesa. O que não é usado nesse dia fica registado, com o peso e a data. No fim do mês as casas juntam-se e acertam as contas.
          </FadeUp>
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
            text="As casas"
            mode="words"
            className="font-display text-[clamp(2rem,4vw,3.2rem)] leading-[1.05] tracking-[-0.03em]"
          />
        </FadeUp>
        <ul className="mt-8 border-t border-ink/15">
          {houses.map((house, index) => (
            <FadeUp
              as="li"
              key={house.slug}
              delay={index * 0.06}
              className="grid gap-2 border-b border-ink/15 py-6 md:grid-cols-12 md:items-baseline md:gap-6"
            >
              <h3 className="font-display text-2xl tracking-[-0.03em] md:col-span-4">{house.name}</h3>
              <p className="md:col-span-3">{house.role}</p>
              <p className="text-ink-soft md:col-span-5">
                {house.place}. {house.line}
              </p>
            </FadeUp>
          ))}
        </ul>

        <FadeUp className="mt-16">
          <PartnerLogos />
        </FadeUp>
      </div>
    </div>
  );
}
