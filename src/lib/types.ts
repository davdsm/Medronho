export type PublicPost = {
  slug: string;
  title: string;
  excerpt: string;
  body: string[];
  image: string;
  imageAlt: string;
  author: string;
  category: string;
  publishedAt: string;
  updatedAt: string;
};

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

/** "2025-11-12" → "12 Nov 2025" */
export function formatDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  return `${Number(m[3])} ${MONTHS[Number(m[2]) - 1] ?? m[2]} ${m[1]}`;
}
