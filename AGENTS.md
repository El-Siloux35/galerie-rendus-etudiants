## Development

Le serveur de dev est démarré par l'aperçu, via la configuration `galerie`
de `.claude/launch.json` (port 4321).

**Ne pas lancer `astro dev --background` en parallèle** : les deux mécanismes
se disputeraient le port 4321 et l'aperçu refuserait de démarrer. Si un
serveur d'arrière-plan tourne déjà, l'arrêter d'abord avec `astro dev stop`
(`astro dev status` pour le savoir).

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)

## Ce projet

Galerie de rendus d'étudiants. Voir `README.md` (comment ajouter un contenu) et
`PLAN.md` (cadrage, phases restantes).

### Écriture

**Ne jamais utiliser le tiret cadratin (—) dans un texte**, ni dans l'interface,
ni dans le contenu, ni dans la documentation, ni dans les messages de commit.
Employer à la place deux points, une virgule, une parenthèse, ou couper la
phrase en deux.

### Contenu et code

- Le contenu vit dans `src/content/` et est validé par `src/content.config.ts`.
  Toute modification de champ passe d'abord par ce schéma.
- La **classe est portée par le rendu** (`class: G4A`), jamais par une fiche
  étudiant globale : c'est la classe du groupe au moment du projet. Un étudiant
  d'une autre classe se note `{ name: ..., class: ... }` dans `students`.
- Interface en noir et blanc stricte. Les couleurs passent par les jetons de
  `src/styles/global.css` ; ne pas écrire de valeur en dur.
- Animations : GSAP, plus un seul effet WebGL (OGL) sur l'accueil. Toute
  animation ajoutée doit se couper sous `prefers-reduced-motion`.
- Les rendus HTML d'étudiants s'ouvrent dans un onglet, jamais en iframe :
  voir le commentaire dans `src/components/Media.astro` pour le pourquoi.
- Les médias lourds (PDF InDesign, vidéos) sont compressés avant d'entrer
  dans le dépôt (voir `README.md`).
- Skills d'interface disponibles dans `.agents/skills/` (`better-ui`,
  `better-typography`, `interface-review`, `variant`…).
