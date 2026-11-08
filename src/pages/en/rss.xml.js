import { buildRss } from '../../rss';

export const GET = (context) => buildRss(context, 'en');
