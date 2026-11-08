import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { content, profile } from './data/site';
import { localizePath, useTranslations, type Lang } from './i18n/ui';
import { entrySlug, getPosts } from './utils';

export async function buildRss(context: APIContext, lang: Lang) {
  const t = useTranslations(lang);
  const posts = await getPosts(lang);
  return rss({
    title: `${t('rss.title')} ${profile.name}`,
    description: content[lang].description,
    site: context.site!,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      link: localizePath(`/blog/${entrySlug(post)}/`, lang),
    })),
    customData: `<language>${lang}</language>`,
  });
}
