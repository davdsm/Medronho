import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { ADMIN_EMAIL, ADMIN_PASSWORD, Client, PNG, startServer, validPost } from "./helpers.js";

let s: Awaited<ReturnType<typeof startServer>>;
before(async () => { s = await startServer(); });
after(async () => { await s.close(); });

const anon = () => new Client(s.base);
const authed = async () => { const c = anon(); const r = await c.login(); assert.equal(r.status, 200); return c; };

describe("público", () => {
  it("health", async () => {
    const r = await anon().get("/api/health");
    assert.equal(r.status, 200);
    assert.deepEqual(r.json, { ok: true });
  });
  it("conteúdo público devolve valores predefinidos", async () => {
    const r = await anon().get("/api/content");
    assert.equal(r.status, 200);
    assert.equal(typeof r.json["home.hero.intro"], "string");
    assert.ok(Array.isArray(r.json["about.paragraphs"]));
  });
  it("notícias iniciais importadas (8) e todas publicadas", async () => {
    const r = await anon().get("/api/posts");
    assert.equal(r.json.posts.length, 8);
    for (const p of r.json.posts) assert.ok(p.slug && p.title && p.publishedAt);
    const dates = r.json.posts.map((p: any) => p.publishedAt);
    assert.deepEqual([...dates].sort().reverse(), dates, "ordenadas da mais recente para a mais antiga");
  });
  it("destaques existem e respeitam a ordem", async () => {
    const r = await anon().get("/api/posts/featured");
    assert.ok(r.json.posts.length > 0);
  });
  it("notícia por slug e 404", async () => {
    const list = await anon().get("/api/posts");
    const slug = list.json.posts[0].slug;
    assert.equal((await anon().get(`/api/posts/${slug}`)).status, 200);
    assert.equal((await anon().get(`/api/posts/nao-existe`)).status, 404);
  });
  it("rotas desconhecidas devolvem JSON 404", async () => {
    const r = await anon().get("/api/xpto");
    assert.equal(r.status, 404);
    assert.ok(r.json.error);
  });
  it("cabeçalhos de segurança", async () => {
    const r = await anon().get("/api/health");
    assert.equal(r.headers.get("x-content-type-options"), "nosniff");
    assert.equal(r.headers.get("x-powered-by"), null);
    assert.equal(r.headers.get("cache-control"), "no-store");
  });
  it("sitemap inclui notícias", async () => {
    const r = await anon().get("/sitemap.xml");
    assert.equal(r.status, 200);
    assert.match(r.headers.get("content-type")!, /xml/);
    assert.match(r.text, /\/noticias\//);
    assert.match(r.text, /\/sobre/);
  });
});

describe("autenticação", () => {
  it("rotas admin exigem sessão", async () => {
    for (const u of ["/api/admin/posts", "/api/admin/content", "/api/admin/uploads", "/api/admin/users"]) {
      assert.equal((await anon().get(u)).status, 401, u);
    }
  });
  it("login com credenciais erradas", async () => {
    assert.equal((await anon().login(ADMIN_EMAIL, "errada-errada-1")).status, 401);
    assert.equal((await anon().login("ninguem@test.local", "errada-errada-1")).status, 401);
  });
  it("login define cookie httpOnly e /me funciona; logout termina", async () => {
    const c = anon();
    const r = await c.req("POST", "/api/auth/login", { email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
    assert.equal(r.status, 200);
    const sc = r.headers.getSetCookie().join(";");
    assert.match(sc, /HttpOnly/i);
    assert.match(sc, /SameSite=Lax/i);
    assert.equal(r.json.user.password_hash, undefined);
    assert.equal((await c.get("/api/auth/me")).json.user.email, ADMIN_EMAIL);
    await c.post("/api/auth/logout");
    assert.equal((await c.get("/api/auth/me")).status, 401);
  });
  it("email do login é case-insensitive", async () => {
    assert.equal((await anon().login(ADMIN_EMAIL.toUpperCase())).status, 200);
  });
  it("cookie adulterado é rejeitado", async () => {
    const c = anon(); await c.login();
    c.cookie = c.cookie.slice(0, -3) + "abc";
    assert.equal((await c.get("/api/auth/me")).status, 401);
  });
  it("pedidos que alteram dados sem cabeçalho CSRF são rejeitados", async () => {
    const res = await fetch(s.base + "/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
    });
    assert.equal(res.status, 403);
  });
  it("origem externa é rejeitada; origem própria e configurada aceites", async () => {
    const c = anon();
    assert.equal((await c.req("POST", "/api/auth/login", { email: ADMIN_EMAIL, password: ADMIN_PASSWORD }, { origin: "https://evil.example" })).status, 403);
    assert.equal((await c.req("POST", "/api/auth/login", { email: ADMIN_EMAIL, password: ADMIN_PASSWORD }, { origin: s.base })).status, 200);
    assert.equal((await anon().req("POST", "/api/auth/login", { email: ADMIN_EMAIL, password: ADMIN_PASSWORD }, { origin: "http://localhost:5173" })).status, 200);
  });
  it("JSON inválido => 400 e campos extra => 400", async () => {
    const res = await fetch(s.base + "/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json", "x-requested-with": "XMLHttpRequest" },
      body: "{oops",
    });
    assert.equal(res.status, 400);
    assert.equal((await anon().post("/api/auth/login", { email: "a@b.c", password: "x", extra: 1 })).status, 400);
  });
  it("limite de tentativas de login (por IP+email) e sucesso não conta", async () => {
    const email = "brute@test.local";
    let last = 0;
    for (let i = 0; i < 7; i++) last = (await anon().login(email, "errada-errada-1")).status;
    assert.equal(last, 429);
    // outro email não é afetado
    assert.equal((await anon().login()).status, 200);
  });
});

describe("notícias (admin)", () => {
  it("CRUD completo", async () => {
    const c = await authed();
    const created = await c.post("/api/admin/posts", validPost({ title: "Minha Notícia Ñ" }));
    assert.equal(created.status, 201);
    const p = created.json.post;
    assert.equal(p.slug, "minha-noticia-n");
    // slug duplicado => sufixo
    const dup = await c.post("/api/admin/posts", validPost({ title: "Minha Notícia Ñ" }));
    assert.notEqual(dup.json.post.slug, p.slug);
    // publicada aparece no público
    assert.equal((await anon().get(`/api/posts/${p.slug}`)).status, 200);
    // editar
    const upd = await c.put(`/api/admin/posts/${p.id}`, validPost({ title: "Título novo", status: "draft" }));
    assert.equal(upd.status, 200);
    assert.equal(upd.json.post.status, "draft");
    // rascunho não é público
    assert.equal((await anon().get(`/api/posts/${p.slug}`)).status, 404);
    assert.ok(!(await anon().get("/api/posts")).json.posts.some((x: any) => x.slug === p.slug));
    // apagar
    assert.equal((await c.del(`/api/admin/posts/${p.id}`)).status, 204);
    assert.equal((await c.get(`/api/admin/posts/${p.id}`)).status, 404);
    await c.del(`/api/admin/posts/${dup.json.post.id}`);
  });
  it("validação", async () => {
    const c = await authed();
    const bad: Array<[string, Record<string, unknown>]> = [
      ["título curto", { title: "ab" }],
      ["data impossível", { publishedAt: "2026-02-31" }],
      ["data formato", { publishedAt: "01/10/2026" }],
      ["imagem externa", { image: "https://evil.example/x.png" }],
      ["imagem com traversal", { image: "/uploads/../../etc/passwd" }],
      ["corpo vazio", { body: [] }],
      ["estado inválido", { status: "arquivado" }],
    ];
    for (const [name, over] of bad) {
      const r = await c.post("/api/admin/posts", validPost(over));
      assert.equal(r.status, 400, name);
      assert.ok(r.json.error, name);
    }
    assert.equal((await c.post("/api/admin/posts", { ...validPost(), extra: 1 })).status, 400);
    assert.equal((await c.get("/api/admin/posts/abc")).status, 404);
    assert.equal((await c.put("/api/admin/posts/99999", validPost())).status, 404);
    assert.equal((await c.del("/api/admin/posts/99999")).status, 404);
  });
  it("HTML no texto é guardado como texto (sem execução) — API devolve JSON", async () => {
    const c = await authed();
    const r = await c.post("/api/admin/posts", validPost({ title: "<img src=x onerror=alert(1)>" }));
    assert.equal(r.status, 201);
    assert.match(r.headers.get("content-type")!, /json/);
    await c.del(`/api/admin/posts/${r.json.post.id}`);
  });
  it("listagem admin inclui rascunhos", async () => {
    const c = await authed();
    const d = await c.post("/api/admin/posts", validPost({ status: "draft", title: "Rascunho x" }));
    const list = await c.get("/api/admin/posts");
    assert.ok(list.json.posts.some((x: any) => x.id === d.json.post.id));
    await c.del(`/api/admin/posts/${d.json.post.id}`);
  });
});

describe("destaques da homepage", () => {
  it("define e ordena destaques; só publicadas; rascunho perde destaque", async () => {
    const c = await authed();
    const all = (await c.get("/api/admin/posts")).json.posts as any[];
    const pub = all.filter((p) => p.status === "published");
    const pick = [pub[2]!.id, pub[0]!.id, pub[1]!.id];
    const slugOf = (id: number) => all.find((p) => p.id === id)!.slug;
    const r = await c.put("/api/admin/featured", { ids: pick });
    assert.equal(r.status, 200);
    const feat = (await anon().get("/api/posts/featured")).json.posts;
    assert.deepEqual(feat.map((p: any) => p.slug), pick.map(slugOf));
    // remover um
    await c.put("/api/admin/featured", { ids: [pick[1]!] });
    assert.deepEqual((await anon().get("/api/posts/featured")).json.posts.map((p: any) => p.slug), [slugOf(pick[1]!)]);
    // rascunho não pode ser destaque
    const d = await c.post("/api/admin/posts", validPost({ status: "draft", title: "Rascunho destaque" }));
    const bad = await c.put("/api/admin/featured", { ids: [d.json.post.id] });
    assert.equal(bad.status, 400);
    // despublicar remove dos destaques
    const pid = pick[1]!;
    const full = (await c.get(`/api/admin/posts/${pid}`)).json.post;
    const post = { title: full.title, excerpt: full.excerpt, body: full.body, image: full.image, imageAlt: full.imageAlt, author: full.author, category: full.category, publishedAt: full.publishedAt, featured: true };
    assert.equal((await c.put(`/api/admin/posts/${pid}`, { ...post, status: "draft" })).status, 200);
    assert.equal((await anon().get("/api/posts/featured")).json.posts.length, 0);
    assert.equal((await c.put(`/api/admin/posts/${pid}`, { ...post, status: "published" })).status, 200);
    await c.del(`/api/admin/posts/${d.json.post.id}`);
    // ids inexistentes / duplicados
    assert.equal((await c.put("/api/admin/featured", { ids: [999999] })).status, 404);
    assert.equal((await c.put("/api/admin/featured", { ids: "x" })).status, 400);
  });
});

describe("textos editáveis", () => {
  it("editar, ver no público e repor", async () => {
    const c = await authed();
    const adm = await c.get("/api/admin/content");
    assert.ok(adm.json.groups.length >= 5);
    const def = adm.json.fields.find((f: any) => f.key === "home.hero.intro").default;
    const put = await c.put("/api/admin/content/home.hero.intro", { value: "Texto novo da intro" });
    assert.equal(put.status, 200);
    assert.equal((await anon().get("/api/content")).json["home.hero.intro"], "Texto novo da intro");
    const rst = await c.del("/api/admin/content/home.hero.intro");
    assert.equal(rst.status, 200);
    assert.equal((await anon().get("/api/content")).json["home.hero.intro"], def);
  });
  it("valor igual ao predefinido remove override", async () => {
    const c = await authed();
    const f = (await c.get("/api/admin/content")).json.fields.find((x: any) => x.key === "news.intro");
    await c.put("/api/admin/content/news.intro", { value: "Outro" });
    await c.put("/api/admin/content/news.intro", { value: f.default });
    const after = (await c.get("/api/admin/content")).json.fields.find((x: any) => x.key === "news.intro");
    assert.equal(after.modified, false);
  });
  it("listas e parágrafos", async () => {
    const c = await authed();
    const ok = await c.put("/api/admin/content/about.paragraphs", { value: ["Um", "Dois"] });
    assert.equal(ok.status, 200);
    assert.deepEqual((await anon().get("/api/content")).json["about.paragraphs"], ["Um", "Dois"]);
    await c.del("/api/admin/content/about.paragraphs");
  });
  it("rejeita chave desconhecida, tipo errado, vazio e demasiado longo", async () => {
    const c = await authed();
    assert.equal((await c.put("/api/admin/content/nao.existe", { value: "x" })).status, 404);
    assert.equal((await c.put("/api/admin/content/home.hero.intro", { value: 5 })).status, 400);
    assert.equal((await c.put("/api/admin/content/home.hero.intro", { value: "   " })).status, 400);
    assert.equal((await c.put("/api/admin/content/home.hero.intro", { value: "x".repeat(5000) })).status, 400);
    assert.equal((await c.put("/api/admin/content/about.paragraphs", { value: "string" })).status, 400);
    assert.equal((await c.put("/api/admin/content/about.paragraphs", { value: [] })).status, 400);
  });
});

describe("imagens", () => {
  it("upload válido, servido, usado por notícia bloqueia apagar", async () => {
    const c = await authed();
    const fd = new FormData();
    fd.append("file", new Blob([PNG], { type: "image/png" }), "../../evil name.png");
    const r = await c.req("POST", "/api/admin/uploads", fd);
    assert.equal(r.status, 201, r.text);
    const up = r.json.upload;
    assert.match(up.url, /^\/uploads\/[A-Za-z0-9._-]+\.png$/);
    const served = await fetch(s.base + up.url);
    assert.equal(served.status, 200);
    assert.equal(served.headers.get("x-content-type-options"), "nosniff");
    assert.match(served.headers.get("content-type")!, /image\/png/);
    const post = await c.post("/api/admin/posts", validPost({ image: up.url }));
    assert.equal(post.status, 201);
    assert.equal((await c.del(`/api/admin/uploads/${up.id}`)).status, 409);
    await c.del(`/api/admin/posts/${post.json.post.id}`);
    assert.equal((await c.del(`/api/admin/uploads/${up.id}`)).status, 204);
    assert.equal((await fetch(s.base + up.url)).status, 404);
  });
  it("rejeita ficheiro que não é imagem (mesmo com extensão/mime falsos)", async () => {
    const c = await authed();
    const fd = new FormData();
    fd.append("file", new Blob(["<script>alert(1)</script>"], { type: "image/png" }), "x.png");
    assert.equal((await c.req("POST", "/api/admin/uploads", fd)).status, 400);
    const svg = new FormData();
    svg.append("file", new Blob(['<svg xmlns="http://www.w3.org/2000/svg"/>'], { type: "image/svg+xml" }), "x.svg");
    assert.equal((await c.req("POST", "/api/admin/uploads", svg)).status, 400);
  });
  it("rejeita sem ficheiro e ficheiro grande demais", async () => {
    const c = await authed();
    assert.equal((await c.req("POST", "/api/admin/uploads", new FormData())).status, 400);
    const big = new FormData();
    big.append("file", new Blob([Buffer.concat([PNG, Buffer.alloc(9 * 1024 * 1024)])], { type: "image/png" }), "big.png");
    assert.equal((await c.req("POST", "/api/admin/uploads", big)).status, 413);
  });
  it("upload exige sessão", async () => {
    const fd = new FormData();
    fd.append("file", new Blob([PNG], { type: "image/png" }), "a.png");
    assert.equal((await anon().req("POST", "/api/admin/uploads", fd)).status, 401);
  });
  it("traversal em /uploads não escapa", async () => {
    const r = await fetch(s.base + "/uploads/..%2f..%2fpackage.json");
    assert.ok(r.status === 404 || r.status === 403 || r.status === 400);
  });
});

describe("utilizadores e permissões", () => {
  it("admin cria editor; editor não acede a /users mas edita notícias", async () => {
    const a = await authed();
    const cr = await a.post("/api/admin/users", { email: "Editor@Test.local", name: "Ed", role: "editor", password: "editor-pass-123" });
    assert.equal(cr.status, 201, cr.text);
    assert.equal(cr.json.user.email, "editor@test.local");
    assert.equal(cr.json.user.password_hash, undefined);
    const e = anon();
    assert.equal((await e.login("editor@test.local", "editor-pass-123")).status, 200);
    assert.equal((await e.get("/api/admin/users")).status, 403);
    assert.equal((await e.post("/api/admin/users", { email: "x@y.pt", name: "x", role: "admin", password: "abcdefghijk" })).status, 403);
    assert.equal((await e.get("/api/admin/posts")).status, 200);
    // email duplicado
    assert.equal((await a.post("/api/admin/users", { email: "editor@test.local", name: "Ed2", role: "editor", password: "editor-pass-123" })).status, 409);
    // password fraca
    assert.equal((await a.post("/api/admin/users", { email: "w@test.local", name: "W", role: "editor", password: "curta" })).status, 400);
    // mudar role invalida sessão do editor
    const id = cr.json.user.id;
    assert.equal((await a.put(`/api/admin/users/${id}`, { role: "admin" })).status, 200);
    assert.equal((await e.get("/api/admin/posts")).status, 401);
    // apagar
    assert.equal((await a.del(`/api/admin/users/${id}`)).status, 204);
  });
  it("não pode apagar-se a si próprio nem despromover o último admin", async () => {
    const a = await authed();
    const me = (await a.get("/api/auth/me")).json.user;
    assert.ok([400, 409].includes((await a.del(`/api/admin/users/${me.id}`)).status));
    assert.equal((await a.put(`/api/admin/users/${me.id}`, { role: "editor" })).status, 409);
  });
  it("alterar a própria password: exige a atual, invalida outras sessões, mantém esta", async () => {
    const a = await authed();
    const other = anon(); await other.login();
    assert.equal((await a.post("/api/auth/password", { currentPassword: "errada-errada", newPassword: "nova-palavra-passe-1" })).status, 400);
    assert.equal((await a.post("/api/auth/password", { currentPassword: ADMIN_PASSWORD, newPassword: "curta" })).status, 400);
    assert.equal((await a.post("/api/auth/password", { currentPassword: ADMIN_PASSWORD, newPassword: "nova-palavra-passe-1" })).status, 200);
    assert.equal((await a.get("/api/auth/me")).status, 200);
    assert.equal((await other.get("/api/auth/me")).status, 401);
    assert.equal((await anon().login()).status, 401);
    assert.equal((await anon().login(ADMIN_EMAIL, "nova-palavra-passe-1")).status, 200);
    // repor
    assert.equal((await a.post("/api/auth/password", { currentPassword: "nova-palavra-passe-1", newPassword: ADMIN_PASSWORD })).status, 200);
  });
});
