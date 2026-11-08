# Portfolio — Edwin Suarez Barrero

Portfolio personal construido con [Astro](https://astro.build) y [Tailwind CSS](https://tailwindcss.com).

## Características

- Inicio con hero, sobre mí, habilidades, experiencia, proyectos destacados, blog y contacto
- **Bilingüe**: español en `/` e inglés en `/en/`, con selector de idioma, `hreflang`, sitemap y RSS por idioma
- Proyectos y blog en Markdown (content collections con validación de tipos)
- Filtro de proyectos por tecnología
- Modo claro/oscuro (respeta la preferencia del sistema)
- Transiciones de página, animaciones al hacer scroll (respetan `prefers-reduced-motion`)
- SEO: meta tags, Open Graph, URL canónica, sitemap, `robots.txt` y feed RSS
- Responsive y accesible (menú móvil, enlace "saltar al contenido", foco visible)

## Estructura

```text
src/
├── data/site.ts              ← TU INFORMACIÓN en español (es) e inglés (en): bio, skills, experiencia…
├── i18n/ui.ts                ← textos de la interfaz (menú, botones, títulos) en ambos idiomas
├── content/
│   ├── projects/es/*.md      ← un archivo por proyecto en español…
│   ├── projects/en/*.md      ← …y su traducción con el MISMO nombre de archivo
│   └── blog/{es,en}/*.md     ← artículos (el blog se oculta si no hay ninguno)
├── assets/projects/          ← capturas de los proyectos (se optimizan automáticamente)
├── components/pages/         ← las páginas reales; reciben el idioma como prop
├── pages/                    ← rutas en español; pages/en/ son las mismas en inglés
├── layouts/BaseLayout.astro  ← <head>, SEO y hreflang
└── styles/global.css         ← tema (color de acento, fuentes) y estilos de Markdown
```

## Personalizar

1. Edita `src/data/site.ts`. Cada idioma tiene su bloque (`es` y `en`) con la misma estructura.
2. Cambia `site` en `astro.config.mjs` y la URL de `public/robots.txt` por tu dominio.
3. (Opcional) Pon tu CV en `public/` y asigna `cv: { es: '/cv-es.pdf', en: '/cv-en.pdf' }` en `site.ts`.
4. (Opcional) Cambia el color de acento en `@theme` dentro de `src/styles/global.css`.

### Nuevo proyecto

Crea `src/content/projects/es/mi-proyecto.md` y su traducción en `src/content/projects/en/mi-proyecto.md`
(mismo nombre de archivo, así el selector de idioma sabe que son la misma página):

```md
---
title: Mi proyecto
description: Descripción breve.
date: 2026-11-08
tags: [Kotlin, Android]
role: Proyecto propio · Android         # opcional
repo: https://github.com/usuario/repo   # opcional
demo: https://mi-proyecto.com           # opcional
featured: true                          # aparece en el inicio (máx. 3)
images:                                 # opcional; la primera es la portada
  - src: ../../../assets/projects/mi-proyecto/captura.png
    alt: Descripción de la captura
---
Contenido en Markdown...
```

### Nuevo artículo

Crea `src/content/blog/es/mi-articulo.md` (y opcionalmente `src/content/blog/en/mi-articulo.md`).
Si un artículo existe solo en un idioma, el selector de idioma lleva al inicio del otro.

```md
---
title: Mi artículo
description: Resumen.
date: 2026-11-08
tags: [android]
draft: false   # true = solo visible en desarrollo
---
```

## Comandos

| Comando           | Acción                                      |
| :---------------- | :------------------------------------------ |
| `npm install`     | Instala dependencias                        |
| `npm run dev`     | Servidor local en `localhost:4321`          |
| `npm run build`   | Genera el sitio en `./dist/`                |
| `npm run preview` | Previsualiza el build                       |

## Despliegue

El sitio se publica en **https://11d4rkm4n13.github.io/Portfolio/** con GitHub Pages (`base: '/Portfolio'` en `astro.config.mjs`).
Cada `git push` a `main` ejecuta `.github/workflows/deploy.yml`, que compila el sitio y lo publica
automáticamente (tarda 1–2 minutos). El progreso se ve en la pestaña **Actions** del repositorio.

Para usar un dominio propio: agrégalo en *Settings → Pages → Custom domain*, crea `public/CNAME`
con el dominio, borra `base` y actualiza `site` en `astro.config.mjs` y la URL de `public/robots.txt`.
