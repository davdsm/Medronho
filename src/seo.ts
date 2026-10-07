import { useEffect } from "react";
import { partners } from "./data";

const FALLBACK_SITE_URL = "https://medronho.vercel.app";

function trimSlash(url: string) {
  return url.replace(/\/+$/, "");
}

export function getSiteUrl() {
  const fromEnv = import.meta.env.VITE_SITE_URL as string | undefined;
  if (fromEnv?.trim()) return trimSlash(fromEnv.trim());
  if (typeof window !== "undefined" && window.location?.origin) {
    return trimSlash(window.location.origin);
  }
  return FALLBACK_SITE_URL;
}

export const SITE = {
  name: "UNEDO4ALL",
  legalName: "UNEDO4ALL",
  titleDefault: "UNEDO4ALL — conservação e valorização integral do medronho",
  description:
    "Projeto UNEDO4ALL: estratégias inovadoras para conservação e valorização integral do medronho (Arbutus unedo) na indústria alimentar, desenvolvido por um consórcio de oito copromotores.",
  locale: "pt_PT",
  language: "pt-PT",
  keywords: [
    "UNEDO4ALL",
    "medronho",
    "Arbutus unedo",
    "conservação do medronho",
    "valorização do medronho",
    "frutos vermelhos",
    "valorização integral",
    "indústria alimentar",
    "kombucha de medronho",
    "consórcio",
    "copromotores",
    "COMPETE 2030",
    "Portugal 2030",
    "ULO",
    "CATAA",
    "TAGUSVALLEY",
    "SerQ",
    "Decorgel",
    "Beira Baixa",
    "Portugal",
    "investigação industrial",
  ],
  /** Cache-busted absolute path — WhatsApp/FB cache aggressively. */
  ogImagePath: "/og.jpg?v=20261003",
  ogImageAlt:
    "Palavra medronho em tipografia bold sobre fundo amarelo, com um medronho 3D a substituir a letra o",
  themeColor: "#f0c423",
  /** Project logo (not the share image) — used as the Organization logo. */
  logoPath: "/brand/unedo4all-logo.png",
  projectName:
    "Estratégias inovadoras para conservação e valorização integral do Medronho na indústria alimentar",
} as const;

export type SeoInput = {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
  imageAlt?: string;
  type?: "website" | "article";
  noindex?: boolean;
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  section?: string;
  jsonLd?: Record<string, unknown> | Array<Record<string, unknown>>;
};

function absUrl(pathOrUrl: string, origin = getSiteUrl()) {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${origin}${pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`}`;
}

function ensureMeta(selector: string, attrs: Record<string, string>) {
  let el = document.head.querySelector(selector) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    document.head.appendChild(el);
  }
  Object.entries(attrs).forEach(([key, value]) => el!.setAttribute(key, value));
  return el;
}

function ensureLink(rel: string, href: string, attrs: Record<string, string> = {}) {
  let el = document.head.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
  Object.entries(attrs).forEach(([key, value]) => el!.setAttribute(key, value));
  return el;
}

function setJsonLd(data: Record<string, unknown> | Array<Record<string, unknown>> | undefined) {
  const id = "unedo-jsonld";
  const existing = document.getElementById(id);
  if (!data) {
    existing?.remove();
    return;
  }
  const script =
    (existing as HTMLScriptElement | null) ??
    Object.assign(document.createElement("script"), { id, type: "application/ld+json" });
  script.textContent = JSON.stringify(data);
  if (!existing) document.head.appendChild(script);
}

export function organizationJsonLd(origin = getSiteUrl()) {
  return {
    "@type": "Organization",
    "@id": `${origin}/#organization`,
    name: SITE.legalName,
    alternateName: ["UNEDO4ALL", SITE.projectName],
    url: origin,
    logo: {
      "@type": "ImageObject",
      url: absUrl(SITE.logoPath, origin),
      width: 619,
      height: 103,
    },
    image: absUrl(SITE.ogImagePath, origin),
    description: SITE.description,
    areaServed: {
      "@type": "Country",
      name: "Portugal",
    },
    knowsAbout: [
      "medronho",
      "Arbutus unedo",
      "conservação de frutos",
      "valorização alimentar",
    ],
    member: partners.map((partner) => ({
      "@type": "Organization",
      name: partner.name,
      url: partner.url,
    })),
  };
}

export function websiteJsonLd(origin = getSiteUrl()) {
  return {
    "@type": "WebSite",
    "@id": `${origin}/#website`,
    url: origin,
    name: SITE.name,
    description: SITE.description,
    inLanguage: SITE.language,
    publisher: { "@id": `${origin}/#organization` },
  };
}

export function breadcrumbJsonLd(
  items: Array<{ name: string; path: string }>,
  origin = getSiteUrl(),
) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absUrl(item.path, origin),
    })),
  };
}

/** Apply document head SEO for the current route. */
export function useSeo(input: SeoInput = {}) {
  useEffect(() => {
    const origin = getSiteUrl();
    const path = input.path ?? window.location.pathname;
    const url = absUrl(path || "/", origin);
    const rawTitle = input.title?.trim();
    const title = !rawTitle
      ? SITE.titleDefault
      : rawTitle.includes("UNEDO4ALL")
        ? rawTitle
        : `${rawTitle.replace(/\s·\sMedronho$/i, "")} · UNEDO4ALL`;
    const description = input.description?.trim() || SITE.description;
    // Always the brand OG image (ignore per-route images so shares stay consistent).
    const image = absUrl(SITE.ogImagePath, FALLBACK_SITE_URL);
    const imageAlt = SITE.ogImageAlt;
    const type = input.type || "website";

    document.title = title;
    document.documentElement.lang = SITE.language;

    ensureMeta('meta[name="description"]', {
      name: "description",
      content: description,
    });
    ensureMeta('meta[name="keywords"]', {
      name: "keywords",
      content: SITE.keywords.join(", "),
    });
    ensureMeta('meta[name="author"]', { name: "author", content: SITE.name });
    ensureMeta('meta[name="robots"]', {
      name: "robots",
      content: input.noindex
        ? "noindex, nofollow"
        : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
    });
    ensureMeta('meta[name="googlebot"]', {
      name: "googlebot",
      content: input.noindex ? "noindex, nofollow" : "index, follow",
    });
    ensureMeta('meta[name="theme-color"]', {
      name: "theme-color",
      content: SITE.themeColor,
    });

    ensureLink("canonical", url);
    ensureLink("alternate", url, { hrefLang: SITE.language });
    ensureLink("alternate", url, { hrefLang: "x-default" });

    ensureMeta('meta[property="og:type"]', { property: "og:type", content: type });
    ensureMeta('meta[property="og:site_name"]', {
      property: "og:site_name",
      content: SITE.name,
    });
    ensureMeta('meta[property="og:locale"]', {
      property: "og:locale",
      content: SITE.locale,
    });
    ensureMeta('meta[property="og:title"]', { property: "og:title", content: title });
    ensureMeta('meta[property="og:description"]', {
      property: "og:description",
      content: description,
    });
    ensureMeta('meta[property="og:url"]', { property: "og:url", content: url });
    ensureMeta('meta[property="og:image"]', { property: "og:image", content: image });
    ensureMeta('meta[property="og:image:secure_url"]', {
      property: "og:image:secure_url",
      content: image,
    });
    ensureMeta('meta[property="og:image:url"]', {
      property: "og:image:url",
      content: image,
    });
    ensureMeta('meta[property="og:image:type"]', {
      property: "og:image:type",
      content: "image/jpeg",
    });
    ensureMeta('meta[property="og:image:width"]', {
      property: "og:image:width",
      content: "1200",
    });
    ensureMeta('meta[property="og:image:height"]', {
      property: "og:image:height",
      content: "630",
    });
    ensureMeta('meta[property="og:image:alt"]', {
      property: "og:image:alt",
      content: imageAlt,
    });

    ensureMeta('meta[name="twitter:card"]', {
      name: "twitter:card",
      content: "summary_large_image",
    });
    ensureMeta('meta[name="twitter:title"]', { name: "twitter:title", content: title });
    ensureMeta('meta[name="twitter:description"]', {
      name: "twitter:description",
      content: description,
    });
    ensureMeta('meta[name="twitter:image"]', { name: "twitter:image", content: image });
    ensureMeta('meta[name="twitter:image:alt"]', {
      name: "twitter:image:alt",
      content: imageAlt,
    });

    if (type === "article") {
      if (input.publishedTime) {
        ensureMeta('meta[property="article:published_time"]', {
          property: "article:published_time",
          content: input.publishedTime,
        });
      }
      if (input.modifiedTime) {
        ensureMeta('meta[property="article:modified_time"]', {
          property: "article:modified_time",
          content: input.modifiedTime,
        });
      }
      if (input.author) {
        ensureMeta('meta[property="article:author"]', {
          property: "article:author",
          content: input.author,
        });
      }
      if (input.section) {
        ensureMeta('meta[property="article:section"]', {
          property: "article:section",
          content: input.section,
        });
      }
    }

    const graph = Array.isArray(input.jsonLd)
      ? input.jsonLd
      : input.jsonLd
        ? [input.jsonLd]
        : [organizationJsonLd(origin), websiteJsonLd(origin)];

    setJsonLd({
      "@context": "https://schema.org",
      "@graph": graph,
    });
  }, [
    input.title,
    input.description,
    input.path,
    input.image,
    input.imageAlt,
    input.type,
    input.noindex,
    input.publishedTime,
    input.modifiedTime,
    input.author,
    input.section,
    JSON.stringify(input.jsonLd ?? null),
  ]);
}

/** Backward-compatible page helper used across routes. */
export function usePage(title: string, description?: string, path?: string) {
  useSeo({ title, description, path });
}
