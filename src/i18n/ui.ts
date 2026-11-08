export const languages = { es: 'Español', en: 'English' } as const;
export type Lang = keyof typeof languages;
export const defaultLang: Lang = 'es';
export const locales: Record<Lang, string> = { es: 'es-CO', en: 'en-US' };

export const ui = {
  es: {
    'nav.about': 'Sobre mí',
    'nav.experience': 'Experiencia',
    'nav.projects': 'Proyectos',
    'nav.blog': 'Blog',
    'nav.contact': 'Contacto',
    'header.theme': 'Cambiar tema',
    'header.menu': 'Abrir menú',
    'header.lang': 'Read in English',
    'header.skip': 'Saltar al contenido',
    'hero.greeting': 'Hola, soy',
    'hero.available': 'Disponible para nuevas oportunidades',
    'hero.ctaProjects': 'Ver proyectos',
    'hero.ctaContact': 'Contactar',
    'hero.cv': 'Descargar CV',
    'about.eyebrow': 'Sobre mí',
    'about.title': 'Un poco sobre mí',
    'skills.title': 'Habilidades técnicas',
    'experience.eyebrow': 'Experiencia',
    'experience.title': 'Trayectoria',
    'education.title': 'Educación',
    'languages.title': 'Idiomas',
    'projects.eyebrow': 'Proyectos',
    'projects.title': 'Proyectos destacados',
    'projects.all': 'Ver todos los proyectos',
    'blog.eyebrow': 'Blog',
    'blog.title': 'Artículos recientes',
    'blog.all': 'Ver todos los artículos',
    'contact.eyebrow': 'Contacto',
    'contact.title': '¿Trabajamos juntos?',
    'contact.body':
      'Estoy abierto a nuevas oportunidades en desarrollo Android, sistemas de pago y soluciones transaccionales. Si tienes una propuesta o simplemente quieres saludar, escríbeme y te responderé lo antes posible.',
    'contact.email': 'Enviar un email',
    'contact.copied': '¡Copiado! ✓',
    'projectsPage.title': 'Lo que he construido',
    'projectsPage.description': 'Todos los proyectos en los que he trabajado.',
    'projectsPage.intro':
      'Proyectos profesionales en sistemas de pago, transporte público e integración de dispositivos, y proyectos propios.',
    'projectsPage.filterAll': 'Todos',
    'projectsPage.filterLabel': 'Filtrar por tecnología',
    'project.back': 'Volver a proyectos',
    'project.code': 'Código',
    'project.demo': 'Demo',
    'project.viewCode': 'Ver código',
    'project.viewDemo': 'Ver demo',
    'blogPage.title': 'Artículos',
    'blogPage.description': 'Artículos sobre desarrollo, aprendizajes y proyectos.',
    'blogPage.intro': 'Escribo sobre desarrollo Android, sistemas de pago, cosas que aprendo y decisiones técnicas.',
    'blogPage.rss': 'Suscríbete por RSS',
    'blogPage.empty': 'Aún no hay artículos. ¡Pronto!',
    'post.back': 'Volver al blog',
    'post.minutes': 'min de lectura',
    'footer.made': 'Hecho con Astro y Tailwind CSS.',
    'rss.title': 'Blog de',
  },
  en: {
    'nav.about': 'About',
    'nav.experience': 'Experience',
    'nav.projects': 'Projects',
    'nav.blog': 'Blog',
    'nav.contact': 'Contact',
    'header.theme': 'Toggle theme',
    'header.menu': 'Open menu',
    'header.lang': 'Leer en español',
    'header.skip': 'Skip to content',
    'hero.greeting': "Hi, I'm",
    'hero.available': 'Open to new opportunities',
    'hero.ctaProjects': 'View projects',
    'hero.ctaContact': 'Get in touch',
    'hero.cv': 'Download CV',
    'about.eyebrow': 'About',
    'about.title': 'A bit about me',
    'skills.title': 'Technical skills',
    'experience.eyebrow': 'Experience',
    'experience.title': 'Career',
    'education.title': 'Education',
    'languages.title': 'Languages',
    'projects.eyebrow': 'Projects',
    'projects.title': 'Featured projects',
    'projects.all': 'View all projects',
    'blog.eyebrow': 'Blog',
    'blog.title': 'Recent posts',
    'blog.all': 'View all posts',
    'contact.eyebrow': 'Contact',
    'contact.title': "Let's work together",
    'contact.body':
      "I'm open to new opportunities in Android development, payment systems and transactional solutions. If you have a proposal or just want to say hi, send me an email and I'll get back to you as soon as I can.",
    'contact.email': 'Send an email',
    'contact.copied': 'Copied! ✓',
    'projectsPage.title': "What I've built",
    'projectsPage.description': "All the projects I've worked on.",
    'projectsPage.intro':
      'Professional work on payment systems, public transport and device integration, plus my own projects.',
    'projectsPage.filterAll': 'All',
    'projectsPage.filterLabel': 'Filter by technology',
    'project.back': 'Back to projects',
    'project.code': 'Code',
    'project.demo': 'Demo',
    'project.viewCode': 'View code',
    'project.viewDemo': 'View demo',
    'blogPage.title': 'Posts',
    'blogPage.description': 'Posts about development, lessons learned and projects.',
    'blogPage.intro': 'I write about Android development, payment systems, things I learn and technical decisions.',
    'blogPage.rss': 'Subscribe via RSS',
    'blogPage.empty': 'No posts yet. Coming soon!',
    'post.back': 'Back to blog',
    'post.minutes': 'min read',
    'footer.made': 'Built with Astro and Tailwind CSS.',
    'rss.title': 'Blog by',
  },
} as const;

export type UiKey = keyof (typeof ui)['es'];

export function useTranslations(lang: Lang) {
  return (key: UiKey) => ui[lang][key] ?? ui[defaultLang][key];
}

/** Convierte una ruta sin idioma ("/projects") en la ruta del idioma dado ("/en/projects"). */
export function localizePath(path: string, lang: Lang) {
  if (lang === defaultLang) return path;
  return path === '/' ? `/${lang}/` : `/${lang}${path}`;
}

/** Quita el prefijo de idioma de una ruta: "/en/projects" → "/projects". */
export function stripLang(pathname: string) {
  const stripped = pathname.replace(/^\/en(?=\/|$)/, '');
  return stripped === '' ? '/' : stripped;
}
