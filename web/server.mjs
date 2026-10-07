// Servidor do frontend: ficheiros estáticos (SPA) + proxy para a API.
// Sem dependências — só Node >= 22. Usado dentro do contentor `web` e para testes locais.
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import zlib from "node:zlib";

const PORT = Number.parseInt(process.env.PORT ?? "8080", 10);
const HOST = process.env.HOST ?? "0.0.0.0";
const DIST = path.resolve(process.env.DIST_DIR ?? "./dist");
const API = new URL(process.env.API_URL ?? "http://127.0.0.1:3001");
const PROXIED = [/^\/api(\/|$)/, /^\/uploads\//, /^\/sitemap\.xml$/];

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".pdf": "application/pdf",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".glb": "model/gltf-binary",
};
const COMPRESSIBLE = /^(text\/|application\/(json|xml|manifest\+json)|image\/svg\+xml)/;

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Frame-Options": "SAMEORIGIN",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

const gzipCache = new Map(); // ficheiro+mtime -> Buffer

function send(res, status, headers, body) {
  res.writeHead(status, { ...SECURITY_HEADERS, ...headers });
  res.end(body);
}

function resolveFile(urlPath) {
  let decoded;
  try {
    decoded = decodeURIComponent(urlPath);
  } catch {
    return null;
  }
  if (decoded.includes("\0")) return null;
  const file = path.join(DIST, path.normalize(decoded));
  if (file !== DIST && !file.startsWith(DIST + path.sep)) return null; // path traversal
  return file;
}

function statFile(file) {
  try {
    const st = fs.statSync(file);
    return st.isFile() ? st : null;
  } catch {
    return null;
  }
}

function serveStatic(req, res, urlPath) {
  let file = resolveFile(urlPath);
  if (!file) return send(res, 400, { "Content-Type": "text/plain; charset=utf-8" }, "Pedido inválido");

  let st = statFile(file);
  let spaFallback = false;
  if (!st) {
    // Pedidos de ficheiros (com extensão) que não existem => 404; o resto é uma rota da SPA.
    if (path.extname(urlPath)) return send(res, 404, { "Content-Type": "text/plain; charset=utf-8" }, "Não encontrado");
    file = path.join(DIST, "index.html");
    st = statFile(file);
    spaFallback = true;
    if (!st) return send(res, 500, { "Content-Type": "text/plain; charset=utf-8" }, "Frontend não construído (falta dist/index.html)");
  }

  const ext = path.extname(file).toLowerCase();
  const type = TYPES[ext] ?? "application/octet-stream";
  const immutable = urlPath.startsWith("/assets/");
  const headers = {
    "Content-Type": type,
    "Cache-Control": immutable ? "public, max-age=31536000, immutable" : ext === ".html" || spaFallback ? "no-cache" : "public, max-age=3600",
    Vary: "Accept-Encoding",
  };
  const etag = `W/"${st.size.toString(16)}-${Math.floor(st.mtimeMs).toString(16)}"`;
  headers.ETag = etag;
  if (req.headers["if-none-match"] === etag) return send(res, 304, headers);

  let body = null;
  if (COMPRESSIBLE.test(type) && /\bgzip\b/.test(String(req.headers["accept-encoding"] ?? "")) && st.size > 1024) {
    const key = `${file}:${st.mtimeMs}`;
    let gz = gzipCache.get(key);
    if (!gz) {
      gz = zlib.gzipSync(fs.readFileSync(file));
      gzipCache.set(key, gz);
    }
    body = gz;
    headers["Content-Encoding"] = "gzip";
  }
  if (req.method === "HEAD") {
    headers["Content-Length"] = body ? body.length : st.size;
    return send(res, 200, headers);
  }
  if (body) {
    headers["Content-Length"] = body.length;
    return send(res, 200, headers, body);
  }
  headers["Content-Length"] = st.size;
  res.writeHead(200, { ...SECURITY_HEADERS, ...headers });
  fs.createReadStream(file).pipe(res);
}

function proxy(req, res) {
  const headers = { ...req.headers };
  const remote = req.socket.remoteAddress ?? "";
  headers["x-forwarded-for"] = headers["x-forwarded-for"] ? `${headers["x-forwarded-for"]}, ${remote}` : remote;
  headers["x-forwarded-proto"] = headers["x-forwarded-proto"] ?? "http";
  headers["x-forwarded-host"] = req.headers.host ?? "";
  // `host` mantém-se (a API compara-o com o cabeçalho Origin).
  const upstream = http.request(
    { hostname: API.hostname, port: API.port || 80, method: req.method, path: req.url, headers },
    (up) => {
      res.writeHead(up.statusCode ?? 502, { ...up.headers, ...SECURITY_HEADERS });
      up.pipe(res);
    },
  );
  upstream.setTimeout(30_000, () => upstream.destroy(new Error("timeout")));
  upstream.on("error", () => {
    if (!res.headersSent) {
      send(res, 502, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }, JSON.stringify({ error: "Serviço temporariamente indisponível." }));
    } else res.destroy();
  });
  req.pipe(upstream);
}

const server = http.createServer((req, res) => {
  const url = req.url ?? "/";
  const pathname = url.split("?")[0] ?? "/";
  if (pathname === "/healthz") {
    return send(res, 200, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" }, "ok");
  }
  if (PROXIED.some((re) => re.test(pathname))) return proxy(req, res);
  if (req.method !== "GET" && req.method !== "HEAD") {
    return send(res, 405, { "Content-Type": "text/plain; charset=utf-8", Allow: "GET, HEAD" }, "Método não permitido");
  }
  serveStatic(req, res, pathname);
});

server.requestTimeout = 60_000;
server.listen(PORT, HOST, () => {
  console.log(`Frontend em http://${HOST}:${PORT} (dist: ${DIST}, API: ${API.origin})`);
});
for (const sig of ["SIGTERM", "SIGINT"]) {
  process.on(sig, () => server.close(() => process.exit(0)));
}
