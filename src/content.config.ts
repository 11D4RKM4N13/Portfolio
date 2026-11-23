import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Cada colección tiene una carpeta por idioma: es/ y en/.
// Una traducción debe tener el mismo nombre de archivo en ambas carpetas.
const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: ({ image }) => z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    repo: z.string().url().optional(),
    demo: z.string().url().optional(),
    featured: z.boolean().default(false),
    role: z.string().optional(),
    // Capturas: la primera se usa como portada en las tarjetas
    images: z.array(z.object({ src: image(), alt: z.string() })).default([]),
  }),
});

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z
    .object({
      title: z.string(),
      description: z.string(),
      date: z.coerce.date(),
      // Fecha de la última revisión importante (se muestra junto a la de publicación)
      updated: z.coerce.date().optional(),
      // Temas del artículo: Kotlin, POO, Java, Fundamentos...
      tags: z.array(z.string()).default([]),
      level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
      // Serie de artículos que se leen en orden. El nombre debe ser idéntico en
      // todos los artículos de la serie (dentro de cada idioma).
      series: z.string().optional(),
      seriesOrder: z.number().int().positive().optional(),
      draft: z.boolean().default(false),
    })
    .refine((data) => !data.series || data.seriesOrder, {
      message: 'seriesOrder es obligatorio cuando el artículo pertenece a una serie',
      path: ['seriesOrder'],
    }),
});

export const collections = { projects, blog };
