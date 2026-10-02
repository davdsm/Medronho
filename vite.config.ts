import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv, type Plugin } from "vite";

const rootDir = dirname(fileURLToPath(import.meta.url));

const POST_SLUGS = [
  "colheita-no-dedo",
  "doce-acido",
  "quinta-feira",
  "flor-e-fruto",
  "mesa-do-fim-de-semana",
  "encosta-vermelha",
  "frasco-de-janeiro",
  "plantas-novas",
] as const;

function seoFilesPlugin(siteUrl: string): Plugin {
  const origin = siteUrl.replace(/\/+$/, "");
  const paths = [
    "/",
    "/consorcio",
    "/noticias",
    "/privacidade",
    "/termos",
    ...POST_SLUGS.map((slug) => `/noticias/${slug}`),
  ];

  const write = (outDir: string) => {
    const today = new Date().toISOString().slice(0, 10);
    const urls = paths
      .map((path) => {
        const loc = `${origin}${path}`;
        const priority =
          path === "/" ? "1.0" : path.startsWith("/noticias/") ? "0.7" : "0.8";
        const changefreq = path === "/" ? "weekly" : path === "/noticias" ? "weekly" : "monthly";
        return `  <url>
    <loc>${loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
      })
      .join("\n");

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

    const robots = `# UNEDO4ALL
User-agent: *
Allow: /

User-agent: Twitterbot
Allow: /

User-agent: facebookexternalhit
Allow: /

User-agent: LinkedInBot
Allow: /

Sitemap: ${origin}/sitemap.xml
`;

    writeFileSync(resolve(outDir, "sitemap.xml"), sitemap);
    writeFileSync(resolve(outDir, "robots.txt"), robots);
  };

  return {
    name: "unedo-seo-files",
    configureServer() {
      write(resolve(rootDir, "public"));
    },
    closeBundle() {
      write(resolve(rootDir, "dist"));
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const siteUrl = env.VITE_SITE_URL || "https://medronho.vercel.app";

  return {
    plugins: [react(), tailwindcss(), seoFilesPlugin(siteUrl)],
  };
});
