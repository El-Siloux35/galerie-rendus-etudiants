import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * Un sujet = un énoncé donné à une classe. C'est l'unité de navigation
 * de la page d'accueil (une ligne horizontale par sujet).
 */
const subjects = defineCollection({
  loader: glob({ base: './src/content/subjects', pattern: '**/*.md' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      /** Année scolaire de l'énoncé, ex. 2025 pour 2025-2026. */
      year: z.number().int(),
      /** Ordre d'affichage sur l'accueil. Plus petit = plus haut. */
      order: z.number().int().default(0),
      /** Résumé d'une ou deux phrases, affiché sur la page du sujet. */
      brief: z.string(),
      cover: image(),
      tags: z.array(z.string()).default([]),
      draft: z.boolean().default(false),
    }),
});

/**
 * Les médias qui composent un rendu. L'union discriminée garantit que
 * chaque type porte bien les champs dont la visionneuse a besoin :
 * oublier `url` sur un lien Figma casse le build, jamais le site en ligne.
 */
const mediaItem = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('pdf'),
    /** Chemin depuis /public, ex. /rendus/2025/musee/presentation.pdf */
    src: z.string(),
    label: z.string().default('Présentation'),
  }),
  z.object({
    type: z.literal('video'),
    /** Fichier compressé dans /public, ex. /rendus/2025/musee/film.mp4 */
    src: z.string(),
    poster: z.string().optional(),
    label: z.string().default('Vidéo'),
  }),
  z.object({
    type: z.literal('html'),
    /** Dossier servi tel quel, ex. /rendus/2025/musee/site/index.html */
    src: z.string(),
    label: z.string().default('Site'),
  }),
  z.object({
    type: z.literal('figma'),
    /** Lien de partage Figma, converti en lien d'intégration à l'affichage. */
    url: z.string().url(),
    /** Proportions du cadre. Mettre "9 / 16" pour un prototype mobile. */
    ratio: z.string().default('16 / 9'),
    label: z.string().default('Prototype Figma'),
  }),
  z.object({
    type: z.literal('image'),
    src: z.string(),
    alt: z.string(),
    label: z.string().optional(),
  }),
  z.object({
    type: z.literal('link'),
    url: z.string().url(),
    label: z.string(),
  }),
]);

/**
 * Déduit le niveau d'une classe : « G4A » donne « G4 », « B2 Design » donne
 * « B2 », « AD5 » reste « AD5 ». Évite de saisir deux fois la même chose,
 * tout en laissant la possibilité de forcer le niveau à la main.
 */
function levelFromClass(value: string): string {
  const first = value.trim().split(/\s+/)[0] ?? value;
  return first.replace(/(\d)[A-Za-z]+$/, '$1');
}

/**
 * Un étudiant : son nom seul, ou un objet si sa classe diffère de celle
 * du groupe (cas d'un rendu inter-classes).
 */
const student = z
  .union([z.string(), z.object({ name: z.string(), class: z.string().optional() })])
  .transform((value) => (typeof value === 'string' ? { name: value } : value));

/**
 * Un rendu = le travail d'un groupe ou d'une personne sur un sujet.
 *
 * La classe est portée par le RENDU, et non par une fiche étudiant globale :
 * c'est la classe du groupe au moment du projet. Le même étudiant peut donc
 * apparaître en B2 en 2025 et en B3 en 2026.
 */
const projects = defineCollection({
  loader: glob({ base: './src/content/projects', pattern: '**/*.md' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      subject: reference('subjects'),
      year: z.number().int(),
      /** Classe du groupe au moment du projet, ex. "G4A". */
      class: z.string(),
      /**
       * Niveau servant au filtre de l'accueil, ex. "G4", "AD5".
       * Laissé vide, il est déduit de la classe.
       */
      level: z.string().optional(),
      students: z.array(student).min(1),
      cover: image(),
      coverAlt: z.string(),
      /** Mis en avant en tête de la page du sujet. */
      featured: z.boolean().default(false),
      media: z.array(mediaItem).default([]),
      draft: z.boolean().default(false),
    })
    // Le niveau est toujours présent après lecture, déduit au besoin :
    // les pages n'ont donc jamais à gérer le cas absent.
    .transform((data) => ({ ...data, level: data.level ?? levelFromClass(data.class) })),
});

export const collections = { subjects, projects };
