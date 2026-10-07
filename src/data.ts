export type House = {
  slug: string;
  name: string;
  role: string;
  place: string;
  line: string;
  image: string;
  alt: string;
  body: string[];
};

export type Partner = {
  name: string;
  logo: string;
  url: string;
  kind: "enesii" | "empresa";
};

export const houses: House[] = [
  {
    slug: "ribeira-funda",
    name: "Ribeira Funda",
    role: "Pomares e colheita",
    place: "São Brás de Alportel",
    line: "São os medronheiros no calcário. A caixa começa aqui.",
    image: "/photos/harvest.jpg",
    alt: "Mãos a colher medronhos num medronheiro do Barrocal.",
    body: [
      "A Ribeira Funda trata dos medronheiros mais velhos, os que já dão fruto e flor ao mesmo tempo. A colheita é à mão, três manhãs por semana, de outubro a janeiro.",
      "O que cede ao dedo entra na caixa. O que ainda está duro fica na árvore. Não se apanha de um dia para o outro só porque alguém pediu.",
    ],
  },
  {
    slug: "oficina-rubra",
    name: "Oficina Rubra",
    role: "Polpa, seco e câmara",
    place: "Loulé",
    line: "À quinta-feira chega a caixa e o fruto é tratado nesse dia.",
    image: "/photos/basket.jpg",
    alt: "Cesto de medronhos maduros sobre pedra clara.",
    body: [
      "A Oficina não tem árvores. Tem câmara fria, despolpadeira e tabuleiros para secar. À quinta-feira recebe a caixa e reparte: polpa, seco e fruto cru.",
      "Não se guarda fruto à espera de um preço melhor. O que não vai para a cozinha ou para o doce fica registado, com o dia e o peso.",
    ],
  },
  {
    slug: "docaria-do-mato",
    name: "Doçaria do Mato",
    role: "Compotas e geleia",
    place: "Salir",
    line: "O doce fica um bocado ácido. O açúcar não tapa o sabor.",
    image: "/photos/jar.jpg",
    alt: "Frasco de doce de medronho numa mesa amarela, com fruto ao lado.",
    body: [
      "O doce fica ácido de propósito. O açúcar serve para a polpa aguentar, não para adoçar demais. Em cada frasco está o mês da colheita.",
      "Coze-se em tachos pequenos, de manhã, com a polpa do dia anterior. O de novembro sabe mais fresco. O de janeiro sabe mais forte.",
    ],
  },
  {
    slug: "mesa-da-serra",
    name: "Mesa da Serra",
    role: "Cozinha",
    place: "Querença",
    line: "Aqui o medronho vai para o prato, não fica só no frasco.",
    image: "/photos/plate.jpg",
    alt: "Prato com medronhos, queijo fresco e mel.",
    body: [
      "Na Mesa da Serra o medronho entra na comida: assado, com queijo e mel, ou cru quando acaba de chegar. A ementa muda conforme o que vem na caixa.",
      "O que sobra ao domingo volta para a Oficina. Não se guarda fruto só porque está bonito.",
    ],
  },
  {
    slug: "viveiro-caldeirao",
    name: "Viveiro Caldeirão",
    role: "Plantas novas",
    place: "Benafim",
    line: "Plantas novas para quem quiser pôr medronheiros no Barrocal.",
    image: "/photos/branch.jpg",
    alt: "Ramo de medronheiro com frutos vermelhos e folhas verdes.",
    body: [
      "O Viveiro Caldeirão cria medronheiros novos para quem quiser plantar no Barrocal. A árvore demora anos a dar fruto, e o consórcio acompanha esse tempo.",
      "Quem planta connosco entra na caixa quando a árvore começar a produzir. Até lá, a sombra e a rega são partilhadas.",
    ],
  },
];

export const partners: Partner[] = [
  {
    name: "ULO — Universidade de Leiria e Oeste",
    logo: "/partners/ulo.png",
    url: "https://www.ulo.pt/",
    kind: "enesii",
  },
  {
    name: "CATAA — Centro de Apoio Tecnológico Agro Alimentar",
    logo: "/partners/cataa.png",
    url: "https://www.cataa.pt/",
    kind: "enesii",
  },
  {
    name: "TAGUSVALLEY — Parque de Ciência e Tecnologia",
    logo: "/partners/tagus-valley.png",
    url: "https://tagusvalley.pt/",
    kind: "enesii",
  },
  {
    name: "SerQ — Centro de Inovação e Competências da Floresta",
    logo: "/partners/serq.png",
    url: "https://www.serq.pt/",
    kind: "enesii",
  },
  {
    name: "Decorgel — Produtos Alimentares, S.A.",
    logo: "/partners/decorgel.png",
    url: "https://www.decorgel.pt/pt/",
    kind: "empresa",
  },
  {
    name: "Sõsu Kombucha",
    logo: "/partners/sosu.png",
    url: "https://sosukombucha.com/",
    kind: "empresa",
  },
  {
    name: "Medronho & Canela",
    logo: "/partners/medronho-canela.png",
    url: "https://medronhoecanela.com/",
    kind: "empresa",
  },
  {
    name: "Santos & Marçal, SA",
    logo: "/partners/santos-marcal.png",
    url: "https://www.santosemarcal.pt/index.php/pt",
    kind: "empresa",
  },
];

export function getHouse(slug: string) {
  return houses.find((house) => house.slug === slug);
}
