import { Fragment, type ReactNode } from "react";

const SPECIES = "Arbutus unedo";

/** Nome científico em itálico (convenção da nomenclatura binomial). */
export function Species() {
  return <i lang="la">{SPECIES}</i>;
}

/** Devolve o texto com todas as ocorrências do nome da espécie em itálico. */
export function withSpecies(text: string): ReactNode {
  const parts = text.split(SPECIES);
  if (parts.length === 1) return text;
  return parts.map((part, index) => (
    <Fragment key={index}>
      {index > 0 ? <Species /> : null}
      {part}
    </Fragment>
  ));
}
