# Backoffice UNEDO4ALL

Site público (React/Vite) + API (Node/Express + SQLite) + painel de administração em `/admin`.

```
shared/    textos predefinidos (content.defaults.json) e notícias iniciais (posts.seed.json)
server/    API: autenticação, notícias, destaques, textos, imagens, utilizadores (testes em server/test)
src/       site público e backoffice (src/admin, carregado só em /admin)
web/       servidor do frontend em produção/Docker (ficheiros estáticos + proxy para a API)
```

## Correr com Docker (tudo ligado)

```bash
cp .env.example .env        # opcional
docker compose up --build
```

* Site: <http://localhost:8080> · Backoffice: <http://localhost:8080/admin>
* Na primeira execução é criado o administrador (`ADMIN_EMAIL`, por omissão `admin@unedo4all.local`).
  Se `ADMIN_PASSWORD` estiver vazio, a palavra-passe é **gerada e escrita nos logs uma única vez**:
  `docker compose logs api`. Altere-a em *A minha conta*.
* Os dados (base SQLite, imagens carregadas, segredo de sessão) ficam no volume `unedo-data`.
  Para recomeçar do zero: `docker compose down -v`.

## Correr sem Docker (desenvolvimento)

Precisa de Node ≥ 22.13.

```bash
# terminal 1 — API
cd server && npm install
ADMIN_PASSWORD='uma-palavra-passe-longa' npm run dev     # http://localhost:3001

# terminal 2 — site (Vite faz proxy de /api e /uploads para a API)
npm install && npm run dev                                # http://localhost:5173
```

Testes da API: `cd server && npm test`.
Recuperar acesso: `cd server && npm run cli -- list-users` e `npm run cli -- reset-password <email>`.

## O que se pode editar

| Área | O quê |
| --- | --- |
| Notícias | criar, editar, apagar, rascunho/publicada, data, imagem (carregar ou escolher), slug |
| Página inicial | que notícias aparecem no carrossel e a ordem (sem nenhuma, a secção esconde-se) |
| Textos | abertura da home, friso de palavras, 3 blocos da home, texto do consórcio na home, página Sobre (subtítulo, parágrafos, objetivos, ficha de operação), página Consórcio, introdução das notícias, frase do rodapé |
| Imagens | carregar JPEG/PNG/WebP (até 8 MB); uma imagem em uso não se apaga |
| Utilizadores | só administradores: criar, mudar função/palavra-passe, apagar |

Cada texto pode ser reposto ao original («Repor original»). Não são editáveis pelo backoffice: lista de copromotores e logótipos,
SEO/meta tags, páginas legais (privacidade/termos), fotografias fixas das secções da home.
O nome científico *Arbutus unedo* é posto em itálico automaticamente onde aparecer.

Se a API estiver indisponível, o site mostra os textos e notícias originais (embebidos no build).

## Segurança

* Palavras-passe com bcrypt; sessão em cookie `httpOnly`, `SameSite=Lax` (JWT assinado, 12 h), invalidada ao mudar palavra-passe/função.
* Proteção CSRF: cabeçalho `X-Requested-With` obrigatório + verificação de `Origin` em pedidos que alteram dados.
* Limite de tentativas de login (10 por 15 min por IP+email), validação rigorosa de todos os dados (zod), uploads validados pelo conteúdo real (não pela extensão) e com nome aleatório.
* Papéis: *admin* e *editor*. Não é possível apagar-se a si próprio nem remover o último administrador.
* Em HTTPS ponha `COOKIE_SECURE=true`.

## Variáveis de ambiente da API

`PORT`, `DATA_DIR`, `ADMIN_EMAIL`, `ADMIN_NAME`, `ADMIN_PASSWORD`, `JWT_SECRET`, `SITE_URL`, `ALLOWED_ORIGINS`,
`COOKIE_SECURE`, `SESSION_HOURS`, `MAX_UPLOAD_MB`, `LOGIN_MAX_ATTEMPTS`, `TRUST_PROXY`.
Ver `.env.example` e `server/.env.example`.

## Notas

* A ordem das notícias em `/noticias` é agora da mais recente para a mais antiga (por data de publicação).
* O deploy atual na Vercel (branch `main`) continua a ser só o frontend estático; esta branch (`feat/entire`) acrescenta o backend.
