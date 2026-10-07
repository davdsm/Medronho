import { Link } from "react-router";
import { FadeUp, SplitText, useArrive } from "../components/Reveal";
import { withSpecies } from "../components/Species";
import { breadcrumbJsonLd, useSeo } from "../seo";

type Section = {
  title: string;
  paragraphs: string[];
  list?: string[];
  afterList?: string[];
};

function LegalLayout({
  title,
  description,
  updated,
  sections,
  path,
}: {
  title: string;
  description: string;
  updated: string;
  sections: Section[];
  path: string;
}) {
  useSeo({
    title,
    description,
    path,
    jsonLd: [
      {
        "@type": "WebPage",
        name: title,
        description,
        inLanguage: "pt-PT",
      },
      breadcrumbJsonLd([
        { name: "Início", path: "/" },
        { name: title, path },
      ]),
    ],
  });
  useArrive();

  return (
    <div className="bg-butter px-5 pt-28 pb-24 text-ink md:px-10 md:pt-36 md:pb-32">
      <div className="mx-auto max-w-[760px]">
        <FadeUp hero>
          <SplitText
            as="h1"
            text={title}
            mode="words"
            hero
            className="max-w-[14ch] font-display text-[clamp(2.6rem,6vw,4.6rem)] leading-[0.98] tracking-[-0.03em]"
          />
        </FadeUp>
        <FadeUp as="p" className="mt-5 text-sm text-ink-soft" delay={0.12} hero>
          Última atualização: {updated}
        </FadeUp>

        <div className="mt-12 grid gap-10">
          {sections.map((section, index) => (
            <FadeUp key={section.title} delay={Math.min(0.08 * index, 0.4)} as="section">
              <h2 className="font-display text-[clamp(1.45rem,2.4vw,1.85rem)] leading-[1.15] tracking-[-0.03em]">
                {section.title}
              </h2>
              <div className="mt-4 grid gap-4 text-[1.05rem] leading-relaxed text-ink">
                {section.paragraphs.map((p) => (
                  <p key={p.slice(0, 48)}>{withSpecies(p)}</p>
                ))}
                {section.list ? (
                  <ul className="grid list-disc gap-2 pl-5 marker:text-ink-soft">
                    {section.list.map((item) => (
                      <li key={item.slice(0, 48)}>{withSpecies(item)}</li>
                    ))}
                  </ul>
                ) : null}
                {section.afterList?.map((p) => (
                  <p key={p.slice(0, 48)}>{withSpecies(p)}</p>
                ))}
              </div>
            </FadeUp>
          ))}
        </div>

        <FadeUp className="mt-14 border-t border-ink/15 pt-8">
          <Link to="/" className="text-lg font-medium underline decoration-ink/30 underline-offset-4">
            Voltar ao início
          </Link>
        </FadeUp>
      </div>
    </div>
  );
}

export function PrivacyPage() {
  return (
    <LegalLayout
      title="Política de Privacidade"
      description="Informação sobre o tratamento de dados pessoais no website UNEDO4ALL, nos termos do RGPD e da lei portuguesa."
      updated="3 de outubro de 2026"
      path="/privacidade"
      sections={[
        {
          title: "1. Quem somos",
          paragraphs: [
            "O presente website diz respeito ao projeto UNEDO4ALL, desenvolvido por um consórcio de entidades sediadas em Portugal, com o objetivo de estudar e valorizar o medronho (Arbutus unedo) no setor alimentar.",
            "Para efeitos do Regulamento (UE) 2016/679 (RGPD) e da Lei n.º 58/2019, de 8 de agosto, o responsável pelo tratamento dos dados pessoais recolhidos através deste website é o consórcio UNEDO4ALL, na qualidade de responsável conjunto ou, consoante o fluxo concreto de dados, a entidade do consórcio que determine as finalidades e os meios do tratamento.",
            "Para questões relacionadas com privacidade e proteção de dados, pode contactar-nos através dos meios de contacto disponibilizados no website ou, quando aplicável, do endereço eletrónico indicado para o efeito no projeto.",
          ],
        },
        {
          title: "2. Âmbito",
          paragraphs: [
            "Esta Política de Privacidade aplica-se ao tratamento de dados pessoais efetuado no âmbito da utilização do website UNEDO4ALL, incluindo a navegação nas páginas, o envio de pedidos de contacto ou formulários e a interação com conteúdos informativos do projeto.",
            "Não se conduz à realização de decisões automatizadas com efeitos jurídicos significativos sobre os titulares, nos termos do artigo 22.º do RGPD.",
          ],
        },
        {
          title: "3. Que dados tratamos",
          paragraphs: [
            "Podemos tratar as seguintes categorias de dados pessoais, consoante a forma como utiliza o website:",
          ],
          list: [
            "Dados de identificação e contacto: nome, endereço de correio eletrónico e, se os fornecer, organização ou mensagem;",
            "Dados de navegação e técnicos: endereço IP, tipo de dispositivo e browser, páginas visitadas, data e hora de acesso, e identificadores semelhantes gerados por cookies ou tecnologias equivalentes, quando aplicável;",
            "Dados de comunicação: conteúdo das mensagens que nos envie voluntariamente.",
          ],
          afterList: [
            "Não solicitamos categorias especiais de dados pessoais (como dados de saúde, origem racial ou opinião política). Pedimos que não nos envie esse tipo de informação através do website.",
          ],
        },
        {
          title: "4. Finalidades e fundamentos de licitude",
          paragraphs: [
            "Os dados são tratados para as seguintes finalidades e com os seguintes fundamentos jurídicos (artigo 6.º do RGPD):",
          ],
          list: [
            "Gestão de pedidos de contacto e resposta a comunicações — execução de diligências pré-contratuais a seu pedido e/ou interesse legítimo em responder e gerir o relacionamento com interessados no projeto;",
            "Funcionamento, segurança e melhoria do website — interesse legítimo em assegurar a disponibilidade, integridade e segurança do serviço;",
            "Cumprimento de obrigações legais — quando o tratamento seja necessário para cumprir deveres a que o responsável esteja sujeito;",
            "Comunicações sobre o projeto, quando legalmente exigido o consentimento — consentimento do titular (artigo 6.º, n.º 1, alínea a), do RGPD), o qual pode ser retirado a qualquer momento, sem comprometer a licitude do tratamento efetuado com base no consentimento antes da sua retirada.",
          ],
        },
        {
          title: "5. Prazos de conservação",
          paragraphs: [
            "Conservamos os dados pessoais apenas pelo período necessário às finalidades para que foram recolhidos, ou pelo prazo exigido por lei.",
          ],
          list: [
            "Pedidos de contacto e correspondência: até 24 meses após a última interação, salvo se for necessário conservar por prazo superior para defesa de direitos ou cumprimento de obrigações legais;",
            "Dados de logs e segurança: tipicamente até 12 meses, salvo necessidade de conservação por prazo mais longo em caso de incidente;",
            "Cookies: pelos prazos indicados na secção relativa a cookies ou nas informações do próprio cookie.",
          ],
          afterList: [
            "Terminado o prazo de conservação, os dados são eliminados ou anonimizados de forma segura.",
          ],
        },
        {
          title: "6. Destinatários e subprocessadores",
          paragraphs: [
            "Os seus dados podem ser tratados por entidades do consórcio UNEDO4ALL, na medida do necessário às finalidades do projeto, e por prestadores de serviços que atuem como subprocessadores (por exemplo, alojamento web, serviços de correio eletrónico ou ferramentas de análise), vinculados por contrato e obrigados a tratar os dados apenas segundo as nossas instruções.",
            "Não vendemos dados pessoais a terceiros.",
          ],
        },
        {
          title: "7. Transferências internacionais",
          paragraphs: [
            "Em regra, os dados são tratados no Espaço Económico Europeu (EEE). Se for necessário recorrer a prestadores situados fora do EEE, asseguraremos que existem garantias adequadas nos termos dos artigos 44.º e seguintes do RGPD, nomeadamente decisões de adequação da Comissão Europeia ou cláusulas contratuais-tipo aprovadas, complementadas pelas medidas que se mostrem necessárias.",
          ],
        },
        {
          title: "8. Os seus direitos",
          paragraphs: [
            "Enquanto titular dos dados, e nos termos da legislação aplicável, pode exercer os seguintes direitos:",
          ],
          list: [
            "Direito de acesso;",
            "Direito de retificação;",
            "Direito ao apagamento («direito a ser esquecido»), nos casos previstos na lei;",
            "Direito à limitação do tratamento;",
            "Direito de oposição, incluindo a oposição a tratamentos baseados em interesse legítimo;",
            "Direito à portabilidade dos dados, quando aplicável;",
            "Direito de retirar o consentimento, quando o tratamento se baseie nesse fundamento;",
            "Direito de apresentar reclamação à autoridade de controlo competente.",
          ],
          afterList: [
            "Em Portugal, a autoridade de controlo é a Comissão Nacional de Proteção de Dados (CNPD) — www.cnpd.pt.",
            "Para exercer os seus direitos, contacte-nos através dos meios disponibilizados no website. Poderemos solicitar informação adicional para confirmar a sua identidade, quando tal seja necessário e proporcional.",
          ],
        },
        {
          title: "9. Cookies e tecnologias semelhantes",
          paragraphs: [
            "O website pode utilizar cookies essenciais ao seu funcionamento e, mediante o seu consentimento quando exigido, cookies de análise ou preferências.",
            "Os cookies estritamente necessários ao funcionamento do website podem ser utilizados com base no interesse legítimo ou na necessidade técnica do serviço. Os restantes cookies só serão utilizados com o seu consentimento prévio, nos termos da legislação portuguesa e europeia aplicável.",
            "Pode gerir ou eliminar cookies através das definições do seu browser. A desativação de certos cookies pode afetar algumas funcionalidades do website.",
          ],
        },
        {
          title: "10. Segurança",
          paragraphs: [
            "Adotamos medidas técnicas e organizativas adequadas para proteger os dados pessoais contra o acesso não autorizado, a perda, a destruição ou a alteração ilícita, tendo em conta o estado da técnica, os custos de aplicação e a natureza, o âmbito, o contexto e as finalidades do tratamento.",
          ],
        },
        {
          title: "11. Menores",
          paragraphs: [
            "O website não se destina a menores de 18 anos. Não recolhemos intencionalmente dados de menores. Se tomar conhecimento de que um menor nos forneceu dados pessoais, contacte-nos para procedermos à respetiva eliminação, salvo quando a lei determine de outro modo.",
          ],
        },
        {
          title: "12. Alterações a esta política",
          paragraphs: [
            "Podemos atualizar esta Política de Privacidade para refletir alterações legais, técnicas ou organizativas. A data da última atualização será indicada no topo desta página. Quando as alterações forem substanciais, procuraremos dar um aviso adequado no website.",
          ],
        },
        {
          title: "13. Lei aplicável",
          paragraphs: [
            "Esta Política de Privacidade interpreta-se de acordo com o RGPD, a Lei n.º 58/2019, de 8 de agosto, e demais legislação portuguesa e da União Europeia aplicável em matéria de proteção de dados pessoais.",
          ],
        },
      ]}
    />
  );
}

export function TermsPage() {
  return (
    <LegalLayout
      title="Termos e Condições"
      description="Termos e condições de utilização do website UNEDO4ALL, regidos pela lei portuguesa."
      updated="3 de outubro de 2026"
      path="/termos"
      sections={[
        {
          title: "1. Objeto e aceitação",
          paragraphs: [
            "Os presentes Termos e Condições regulam o acesso e a utilização do website do projeto UNEDO4ALL (doravante, o «Website»), disponibilizado pelo consórcio de entidades que desenvolve o projeto em Portugal.",
            "Ao aceder ou utilizar o Website, o utilizador declara ter lido, compreendido e aceite estes Termos e Condições, bem como a Política de Privacidade. Se não concordar, deve abster-se de utilizar o Website.",
          ],
        },
        {
          title: "2. Natureza do Website",
          paragraphs: [
            "O Website tem carácter informativo e de divulgação do projeto UNEDO4ALL, incluindo conteúdos sobre investigação, valorização do medronho, atividades do consórcio e notícias relacionadas.",
            "Salvo indicação expressa em contrário, os conteúdos não constituem proposta contratual, aconselhamento técnico, jurídico ou científico vinculativo, nem garantia de resultados concretos de investigação ou de produtos.",
          ],
        },
        {
          title: "3. Utilização do Website",
          paragraphs: [
            "O utilizador compromete-se a utilizar o Website de forma lícita, de boa-fé e em conformidade com a lei portuguesa e estes Termos, abstendo-se nomeadamente de:",
          ],
          list: [
            "Utilizar o Website de forma que cause ou possa causar dano, interrupção ou deterioração do serviço;",
            "Tentar aceder de forma não autorizada a sistemas, dados ou áreas restritas;",
            "Introduzir vírus, código malicioso ou praticar qualquer ato que comprometa a segurança;",
            "Utilizar conteúdos do Website para fins ilícitos ou que violem direitos de terceiros;",
            "Reproduzir, distribuir ou explorar comercialmente conteúdos sem autorização prévia, quando tal for legalmente exigido.",
          ],
        },
        {
          title: "4. Propriedade intelectual e industrial",
          paragraphs: [
            "Salvo indicação em contrário, os textos, imagens, logótipos, marcas, gráficos, estrutura e demais conteúdos do Website são protegidos por direitos de propriedade intelectual e/ou industrial pertencentes ao consórcio UNEDO4ALL, às respetivas entidades parceiras ou a terceiros que tenham autorizado a sua utilização.",
            "É permitida a visualização e a utilização privada e não comercial do Website. Qualquer outra utilização, incluindo reprodução, modificação, distribuição pública ou criação de obras derivadas, carece de autorização prévia por escrito do titular dos direitos, salvo nas utilizações livres previstas na lei portuguesa (Código do Direito de Autor e dos Direitos Conexos e demais legislação aplicável).",
          ],
        },
        {
          title: "5. Conteúdos de terceiros e ligações",
          paragraphs: [
            "O Website pode conter ligações para sites de terceiros ou referências a entidades parceiras. Esses sites têm políticas e termos próprios, pelos quais o UNEDO4ALL não se responsabiliza. A inclusão de ligações não implica endosso ou garantia quanto aos respetivos conteúdos ou serviços.",
          ],
        },
        {
          title: "6. Exclusão e limitação de responsabilidade",
          paragraphs: [
            "O Website é disponibilizado «tal como está». Envidamos esforços razoáveis para manter a informação atualizada e o serviço disponível, sem garantir ausência de erros, interrupções ou inexatidões.",
            "Na máxima extensão permitida pela lei portuguesa, o consórcio UNEDO4ALL e as suas entidades não respondem por danos indiretos, lucros cessantes ou prejuízos decorrentes da utilização ou impossibilidade de utilização do Website, salvo em casos de dolo ou culpa grave, ou quando a lei não permita a exclusão de responsabilidade (nomeadamente em matéria de direitos dos consumidores, quando aplicável).",
          ],
        },
        {
          title: "7. Dados pessoais",
          paragraphs: [
            "O tratamento de dados pessoais efetuado através do Website rege-se pela Política de Privacidade, disponível nesta mesma plataforma, e pela legislação aplicável, designadamente o RGPD e a Lei n.º 58/2019, de 8 de agosto.",
          ],
        },
        {
          title: "8. Alterações",
          paragraphs: [
            "Reservamo-nos o direito de alterar estes Termos e Condições a qualquer momento. A versão vigente será a publicada no Website, com indicação da data da última atualização. A utilização continuada do Website após a publicação de alterações constitui aceitação da nova versão, salvo quando a lei exija outro formalismo.",
          ],
        },
        {
          title: "9. Invalidade parcial",
          paragraphs: [
            "Se alguma disposição destes Termos for considerada inválida ou inaplicável, as restantes manter-se-ão em vigor. A disposição inválida será substituída, na medida do possível, por outra que melhor reflita a intenção original e seja conforme à lei.",
          ],
        },
        {
          title: "10. Lei aplicável e foro",
          paragraphs: [
            "Estes Termos e Condições são regidos pela lei portuguesa.",
            "Para a resolução de quaisquer litígios emergentes da interpretação ou execução destes Termos, é competente o foro dos tribunais portugueses, com ressalva das normas imperativas de proteção do consumidor que eventualmente atribuam foro diferente ao utilizador que revista essa qualidade.",
            "Em caso de litígio de consumo, o utilizador consumidor pode também recorrer às entidades de resolução alternativa de litígios de consumo (RAL) e à plataforma europeia de resolução de litígios em linha, nos termos da legislação aplicável.",
          ],
        },
        {
          title: "11. Contacto",
          paragraphs: [
            "Para questões relacionadas com estes Termos e Condições ou com a utilização do Website, utilize os meios de contacto disponibilizados no Website do projeto UNEDO4ALL.",
          ],
        },
      ]}
    />
  );
}
