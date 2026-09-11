# Galerie de projets étudiants — Plan

## 1. Ce qu'on construit

Un site vitrine des rendus d'étudiants :
- **Accueil** = navigation par **sujets**, en grandes lignes horizontales pleine largeur, avec une image de preview qui suit le curseur au survol.
- **Page sujet** = le brief + la liste des rendus.
- **Page rendu** = un groupe (ou une personne), les noms des étudiants + **leur classe au moment du projet**, et les médias du rendu.
- Un rendu = plusieurs médias hétérogènes : PDF, page HTML, vidéo, proto Figma, images, liens.

## 2. Stack recommandée

**Astro 5 + TypeScript + Content Collections (Zod) + GSAP**, déployé en statique.

### Pourquoi Astro
| Besoin | Réponse Astro |
|---|---|
| Site 95 % contenu, chargement instantané | Génération statique, **zéro JS par défaut** |
| Données structurées fiables (sujets, rendus, étudiants) | Content Collections typées **Zod** : un rendu mal rempli casse le build, pas le site |
| Animations lourdes uniquement là où il faut | **Islands** : GSAP / WebGL chargés par page, pas globalement |
| Héberger les pages HTML faites par les étudiants | Dossier `public/` servi tel quel + `<iframe sandbox>` |
| Recherche plein texte plus tard | **Pagefind** (statique, 1 commande) |
| Back-office plus tard | **Decap CMS** (git, gratuit, sans serveur) ou passage SSR via un adaptateur, sans réécriture |
| Hébergement | Netlify / Vercel / GitHub Pages — gratuit |

### Alternatives écartées (et quand les reprendre)
- **Next.js** — à choisir seulement si dès le départ on veut comptes, upload en ligne et base de données. Plus lourd à maintenir, nécessite un serveur.
- **HTML/CSS/JS + Vite** — tient la route à 5 projets, s'effondre à 50 (copier-coller, aucune validation des données).
- **Nuxt / SvelteKit** — équivalents, mais moins orientés contenu qu'Astro.

> Le point clé : **Astro ne ferme aucune porte**. On commence statique et gratuit ; le CMS, la recherche, l'authentification et l'upload s'ajoutent plus tard sans changer de techno.

## 3. Modèle de données

```
src/content/
  subjects/
    2025-affiche-culturelle.md      → title, year, order, brief, cover, tags
  projects/
    2025-affiche-culturelle--groupe-a.md
```

```yaml
title: "Signalétique du Musée X"
subject: 2025-affiche-culturelle     # référence typée vers le sujet
year: 2025
students:
  - { name: "Léa Martin",  class: "B2 Design" }   # classe AU MOMENT du projet
  - { name: "Sam Dupont",  class: "B2 Design" }
cover: ./cover.jpg
media:
  - { type: pdf,    src: ./presentation.pdf,  label: "Présentation" }
  - { type: video,  provider: vimeo, id: "123456789" }
  - { type: html,   src: /rendus/2025/musee-x/index.html }
  - { type: figma,  url: "https://figma.com/proto/..." }
  - { type: image,  src: ./planche-01.jpg }
```

**Décision de modélisation importante** : la classe est stockée **sur le rendu**, pas sur une fiche étudiant globale. Un même étudiant apparaît donc en « B2 » en 2025 et « B3 » en 2026 — historiquement juste. On pourra quand même générer une page `/etudiants/lea-martin` qui agrège ses rendus.

## 4. Où vivent les fichiers

| Type | Emplacement | Raison |
|---|---|---|
| Images, PDF < 10 Mo | dans le dépôt (`src/content/.../`) | optimisés au build |
| **Vidéos** | dans le dépôt, **compressées** (`public/rendus/.../film.mp4`) | peu nombreuses ; ffmpeg H.264 1080p → viser < 50 Mo/fichier (limite git) |
| Pages HTML étudiantes | `public/rendus/<année>/<sujet>/<groupe>/` | servies telles quelles, affichées en `<iframe sandbox>` + lien plein écran |
| Figma | URL de proto partagé publiquement | embed officiel Figma |

## 5. Phases

| # | Phase | Contenu |
|---|---|---|
| ~~P0~~ ✅ | Fondations | Astro + TS, tokens N&B, typo, schémas Zod, 3 contenus de démo |
| ~~P1~~ ✅ | Accueil | lignes de sujets, preview image au curseur (GSAP `quickTo`), reveal au scroll |
| ~~P2~~ ✅ | Page sujet | brief + liste des rendus, filtres année / classe |
| ~~P3~~ ✅ | Page rendu | visionneuse multi-médias (PDF, vidéo, HTML, Figma), crédits, projet suivant |
| **P4** | Recherche & index | Pagefind, page étudiants, page années |
| **P5** | Contribution | CMS web pour l'équipe enseignante (voir §8) |
| **P6** | Finition | accessibilité (`prefers-reduced-motion`), perf, images OG, mise en ligne |

## 6. Direction artistique — noir & blanc

- **Palette** : fond `#0A0A0A`, texte `#F2F2F2`, hairlines `1px` à 12 % d'opacité. Un seul accent optionnel. Inversion clair/sombre possible.
- **Typo** : une grotesque variable (Inter Variable / General Sans / Archivo). Titres très grands, `letter-spacing` négatif, graisse animable au survol.
- **Accueil** : lignes pleine largeur séparées par des filets 1px. Au survol : la ligne se décale, les autres se désaturent, une vignette suit le curseur avec du lag (`gsap.quickTo`, exactement la démo de référence). Compteur de rendus aligné à droite.
- **Grain** : overlay SVG `feTurbulence` très léger — donne le côté impression N&B.
- **Transitions de page** : Astro View Transitions + GSAP.
- **Effet signature WebGL** : distorsion de la vignette au survol, en **OGL (~5 ko)** plutôt que Three.js (~150 ko). Un seul moment de bravoure, le reste reste sobre. Repli propre en image simple si WebGL est indisponible.
- **Motion** : `expo.out`, 0.4–0.8 s, stagger 0.04 s, et coupure totale sous `prefers-reduced-motion`.

## 7. Skills installées

`npx skills add jakubkrehel/skills` → `.agents/skills/` : `better-ui`, `better-typography`, `better-layout`, `better-colors`, `better-accessibility`, `better-writing`, `interface-review`, `variant`, `break`, `explain-interface`.

Utilisation prévue : `variant` en P1 (explorer 3 accueils), `better-typography` + `better-ui` pendant la construction, `interface-review` + `better-accessibility` en P6.

## 7 bis. État au 11 septembre 2026

P0 à P3 sont en place et le site tourne (`npm run dev`). Contenu de
démonstration : 6 sujets, 8 rendus, visuels et PDF générés comme exemples —
tout est à remplacer par les vrais travaux.

Restent P4 (recherche, index étudiants), P5 (CMS) et P6 (finition, mise en ligne).

## 8. Contribution par plusieurs enseignants (P5)

**Décision : CMS web, git en coulisses.** Les enseignants ne manipulent jamais git — ils ouvrent `/admin`, remplissent un formulaire (titre, sujet, étudiants + classes, fichiers) et publient. Le CMS écrit le commit à leur place.

Contrainte à connaître : l'authentification passe par GitHub, donc **chaque enseignant a besoin d'un compte GitHub gratuit** ajouté au dépôt. C'est le prix du « gratuit, sans serveur, tout versionné ».

Candidats à trancher en P5 (aucun impact sur ce qu'on construit d'ici là) :
- **Sveltia CMS** — fork moderne de Decap, bien meilleure UX, config identique. *Favori.*
- **Decap CMS** — le plus répandu, interface plus datée.
- **Pages CMS** — hébergé, rien à configurer, connexion GitHub.
- *Si on veut zéro compte GitHub :* Sanity ou Tina (connexion par e-mail) — mais dépendance externe et contenu hors du dépôt.

**Pourquoi ça ne bloque pas maintenant :** le CMS se configure par-dessus les schémas Zod déjà écrits en P0. Construire d'abord ne coûte rien ; choisir maintenant, si.
