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

export type Post = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  author: string;
  house: string;
  image: string;
  alt: string;
  body: string[];
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

export const posts: Post[] = [
  {
    slug: "colheita-no-dedo",
    title: "A colheita faz-se pelo toque",
    excerpt: "Não olhamos para a data. O fruto está bom quando cede ao dedo.",
    date: "12 Nov 2025",
    author: "Lídia Guerreiro",
    house: "Ribeira Funda",
    image: "/photos/harvest.jpg",
    alt: "Mãos a escolher medronhos maduros entre a folha.",
    body: [
      "O medronho não se apanha por data. Apanha-se pelo toque. Se o fruto resiste, fica na árvore mais uma semana. Se cede, entra no cesto.",
      "Na Ribeira Funda saímos três manhãs por semana, de fins de outubro a janeiro. No mesmo ramo há flor e fruto, por isso é preciso escolher à mão. Ao sol, o fruto verde parece quase maduro. Não está.",
      "A caixa enche-se à quinta-feira. O que a Oficina Rubra não trata nessa semana vai para a Doçaria ou para a Mesa. Não fica à espera de um comprador só de uma casa.",
      "No armazém está escrito: fruto duro não vai para o fundo do cesto. Quem colhe assina o dia. No fim da época comparam-se os cadernos, para ver que encosta deu fruto mais tarde.",
    ],
  },
  {
    slug: "doce-acido",
    title: "O doce fica ácido",
    excerpt: "Pomos açúcar para a polpa aguentar. O doce continua ácido.",
    date: "3 Dez 2025",
    author: "Marta Vinagre",
    house: "Doçaria do Mato",
    image: "/photos/jar.jpg",
    alt: "Doce de medronho em frasco aberto, com uma colher.",
    body: [
      "Se o doce ficar demasiado doce, deixa de saber a medronho. Na Doçaria do Mato o frasco tem de ficar um bocado ácido. O açúcar serve para a polpa aguentar, não para tapar o sabor.",
      "Cozemos em tachos pequenos, de manhã, com a polpa que a Oficina manda no dia anterior. Já vem sem grainha. É vermelha escura e cheira a folha.",
      "No rótulo não vai uma história. Vai o mês da colheita e a casa que apanhou. Quem compra no Mercado da Vila sabe se o frasco é de novembro ou de janeiro. São doces diferentes. O de novembro é mais fresco. O de janeiro é mais forte.",
    ],
  },
  {
    slug: "quinta-feira",
    title: "Quinta-feira é dia de caixa",
    excerpt: "À quinta-feira a caixa passa pelas cinco casas.",
    date: "18 Dez 2025",
    author: "Rui Semedo",
    house: "Oficina Rubra",
    image: "/photos/basket.jpg",
    alt: "Medronhos acabados de chegar, ainda no cesto.",
    body: [
      "A Oficina Rubra não tem pomar. Tem uma câmara, uma despolpadeira e um quadro na parede com os cinco nomes. À quinta-feira de manhã a caixa chega da Ribeira Funda. À tarde já está repartida.",
      "Uma parte fica em polpa, para a Mesa da Serra cozinhar no fim de semana. Outra seca em tabuleiros, para o inverno. O resto segue cru para a Doçaria no próprio dia, porque o fruto amassado não aguenta à espera.",
      "O acordo do consórcio cabe numa folha. Quem colhe não vende por fora nessa semana. Quem transforma não recusa fruto bom. Quem cozinha aponta o que sobrou. No fim do mês juntamo-nos em Salir, vemos os números e acertamos as contas.",
    ],
  },
  {
    slug: "flor-e-fruto",
    title: "Flor e fruto no mesmo ramo",
    excerpt: "Enquanto um fruto vermelha, a árvore já está a florir para o ano a seguir.",
    date: "28 Out 2025",
    author: "Teresa Caldeira",
    house: "Viveiro Caldeirão",
    image: "/photos/branch.jpg",
    alt: "Ramo de medronheiro com flor e fruto ao mesmo tempo.",
    body: [
      "Quem não conhece o medronheiro estranha. No mesmo ramo há flor branca e fruto a vermelhar. Não é doença. É o ciclo normal da árvore.",
      "No Viveiro explicamos isto a quem planta. A árvore demora anos a dar fruto. Quem espera um fruto no primeiro outono fica desiludido. Quem espera flor e fruto juntos, no tempo certo, fica a ver a árvore trabalhar.",
      "Por isso a caixa do consórcio não começa no viveiro. Começa quando o fruto cede. Até lá, a planta cresce e a flor marca o ano seguinte.",
    ],
  },
  {
    slug: "mesa-do-fim-de-semana",
    title: "O fruto chega ao prato",
    excerpt: "Na Mesa da Serra o medronho não fica só no frasco. Vai para a ementa.",
    date: "9 Jan 2026",
    author: "Paulo Nunes",
    house: "Mesa da Serra",
    image: "/photos/plate.jpg",
    alt: "Prato com medronhos, queijo fresco e mel.",
    body: [
      "Ao sábado a ementa muda conforme o que veio na caixa. Se a polpa está boa, vai um molho. Se o fruto está inteiro e cede, vai cru com queijo e mel.",
      "Não inventamos pratos só para parecer novos. O medronho já tem sabor. A cozinha acompanha o fruto, não o contrário.",
      "O que sobra ao domingo volta para a Oficina. Apontamos o peso. No mês seguinte, em Salir, isso conta.",
    ],
  },
  {
    slug: "encosta-vermelha",
    title: "A encosta começa a vermelhar",
    excerpt: "Em novembro o Barrocal muda de cor. A apanha acompanha a encosta, não o calendário.",
    date: "21 Nov 2025",
    author: "Lídia Guerreiro",
    house: "Ribeira Funda",
    image: "/photos/hillside.jpg",
    alt: "Encosta do Barrocal com medronheiros a vermelhar.",
    body: [
      "Há encostas que vermelham cedo e outras que atrasam. No mesmo dia, um lado do vale já dá fruto e o outro ainda está duro.",
      "Por isso não marcamos a apanha numa data fixa. Marcamos pelo olhar e pelo toque. Quando a encosta muda, saímos.",
      "Quem vem na Rota da Serra em novembro vê isto no sítio. A caixa ainda não está cheia. Está a começar.",
    ],
  },
  {
    slug: "frasco-de-janeiro",
    title: "O frasco de janeiro é outro",
    excerpt: "O doce de novembro sabe mais fresco. O de janeiro sabe mais forte.",
    date: "22 Jan 2026",
    author: "Marta Vinagre",
    house: "Doçaria do Mato",
    image: "/photos/jar.jpg",
    alt: "Frasco de doce de medronho numa mesa clara.",
    body: [
      "Quem compra os dois frascos nota a diferença. Em novembro a polpa é mais clara. Em janeiro já vem mais densa e o cheiro é outro.",
      "Não misturamos os meses no mesmo tacho. Cada frasco leva o mês escrito. Se alguém preferir o mais fresco, sabe o que pedir.",
      "No Mercado da Vila isto evita conversas longas. O rótulo diz o essencial.",
    ],
  },
  {
    slug: "plantas-novas",
    title: "Plantas novas para o Barrocal",
    excerpt: "Quem planta agora entra na caixa quando a árvore começar a produzir.",
    date: "4 Fev 2026",
    author: "Teresa Caldeira",
    house: "Viveiro Caldeirão",
    image: "/photos/branch.jpg",
    alt: "Folhas e ramos novos de medronheiro.",
    body: [
      "O Viveiro Caldeirão cria plantas para quem quer medronheiros no calcário. Não prometemos fruto no primeiro ano. Prometemos acompanhamento.",
      "Quem planta com o consórcio fica ligado à caixa. Quando a árvore der fruto bom, esse fruto entra no mesmo circuito das cinco casas.",
      "Até lá, a sombra, a rega e as visitas da Rota ajudam a não desistir a meio.",
    ],
  },
];

export function getHouse(slug: string) {
  return houses.find((house) => house.slug === slug);
}

export function getPost(slug: string) {
  return posts.find((post) => post.slug === slug);
}
