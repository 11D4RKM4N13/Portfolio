import { getCollection, type CollectionEntry } from 'astro:content';
import { locales, type Lang } from './i18n/ui';

type Entry = CollectionEntry<'projects'> | CollectionEntry<'blog'>;

/** "es/taller-del-maestro" → "taller-del-maestro" */
export function entrySlug(entry: Entry) {
  return entry.id.split('/').slice(1).join('/');
}

export function formatDate(date: Date, lang: Lang) {
  return date.toLocaleDateString(locales[lang], { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });
}

export function readingMinutes(text: string) {
  return Math.max(1, Math.round(text.trim().split(/\s+/).length / 220));
}

// Se carga una sola vez por build (el header y el footer lo consultan en cada página)
let allPosts: Promise<CollectionEntry<'blog'>[]> | undefined;

export async function getPosts(lang: Lang) {
  allPosts ??= getCollection('blog', ({ data }) => import.meta.env.DEV || !data.draft);
  const posts = (await allPosts).filter(({ id }) => id.startsWith(`${lang}/`));
  return posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

/** Artículos de la misma serie que `post` (mismo idioma), en orden de lectura. */
export async function getSeriesPosts(post: CollectionEntry<'blog'>, lang: Lang) {
  const { series } = post.data;
  if (!series) return [];
  const posts = (await getPosts(lang)).filter((p) => p.data.series === series);
  return posts.sort((a, b) => (a.data.seriesOrder ?? 0) - (b.data.seriesOrder ?? 0));
}

/**
 * Para los listados: cada serie aparece una sola vez, en la posición de su artículo
 * más reciente, con todas sus partes en orden de lectura. `posts` debe venir de getPosts.
 */
export function groupSeries(posts: CollectionEntry<'blog'>[]) {
  const seen = new Set<string>();
  const items: { post: CollectionEntry<'blog'>; parts: CollectionEntry<'blog'>[] }[] = [];
  for (const post of posts) {
    const { series } = post.data;
    if (!series) {
      items.push({ post, parts: [] });
      continue;
    }
    if (seen.has(series)) continue;
    seen.add(series);
    const parts = posts
      .filter((p) => p.data.series === series)
      .sort((a, b) => (a.data.seriesOrder ?? 0) - (b.data.seriesOrder ?? 0));
    // Una serie con una sola parte publicada se muestra como un artículo normal
    items.push({ post, parts: parts.length > 1 ? parts : [] });
  }
  return items;
}

export async function getProjects(lang: Lang) {
  const projects = await getCollection('projects', ({ id }) => id.startsWith(`${lang}/`));
  return projects.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

const otherLang = (lang: Lang): Lang => (lang === 'es' ? 'en' : 'es');

/** getStaticPaths para el detalle de proyectos de un idioma. */
export async function projectPaths(lang: Lang) {
  const [projects, others] = await Promise.all([getProjects(lang), getProjects(otherLang(lang))]);
  const otherSlugs = new Set(others.map(entrySlug));
  return projects.map((project) => {
    const slug = entrySlug(project);
    return {
      params: { slug },
      props: { project, lang, alternatePath: otherSlugs.has(slug) ? `/projects/${slug}` : null },
    };
  });
}

/** getStaticPaths para los artículos de un idioma. */
export async function postPaths(lang: Lang) {
  const [posts, others] = await Promise.all([getPosts(lang), getPosts(otherLang(lang))]);
  const otherSlugs = new Set(others.map(entrySlug));
  return posts.map((post) => {
    const slug = entrySlug(post);
    return {
      params: { slug },
      props: { post, lang, alternatePath: otherSlugs.has(slug) ? `/blog/${slug}` : null },
    };
  });
}
