# Galerie des rendus étudiants

Site vitrine des travaux d'étudiants. Navigation par **sujet** depuis l'accueil,
puis un **rendu** par groupe ou par personne.

Astro + TypeScript, généré en statique. Voir [PLAN.md](PLAN.md) pour le cadrage
et les phases restantes.

```bash
npm run dev      # http://localhost:4321
npm run build    # site statique dans dist/
npm run preview  # relit dist/ comme en production
```

---

## Ajouter un sujet

Créer `src/content/subjects/<identifiant>.md`. L'identifiant devient l'URL
(`/sujets/<identifiant>`) : en minuscules, sans accent ni espace.

```yaml
---
title: Identité visuelle
year: 2025          # année scolaire de l'énoncé
order: 1            # position sur l'accueil, plus petit = plus haut
brief: Une ou deux phrases qui résument la commande.
cover: ../../assets/covers/identite-visuelle.png   # 900 × 1200 px environ
tags: [Branding, Typographie]
---

Texte libre affiché sur la page du sujet.
```

La couverture sert aussi de vignette au survol sur l'accueil : privilégier une
image lisible en tout petit et contrastée en noir et blanc.

## Ajouter un rendu

Créer `src/content/projects/<identifiant>.md`.

```yaml
---
title: Musée des Arques
subject: identite-visuelle     # doit correspondre à un fichier de subjects/
year: 2025
featured: true                 # remonte en tête de la page du sujet
students:
  - { name: Léa Martin, class: B2 Design }
  - { name: Samuel Dupont, class: B2 Design }
cover: ../../assets/covers/proj-musee.png
coverAlt: Description de l'image pour les lecteurs d'écran
media:
  - { type: pdf,   src: /rendus/2025/musee/charte.pdf, label: Charte graphique }
  - { type: image, src: /rendus/2025/musee/planche.jpg, alt: Affiches déclinées }
  - { type: video, src: /rendus/2025/musee/film.mp4, poster: /rendus/2025/musee/poster.jpg }
  - { type: html,  src: /rendus/2025/musee/site/index.html, label: Site }
  - { type: figma, url: "https://www.figma.com/proto/..." }
  - { type: link,  url: "https://exemple.fr", label: Article de presse }
---

Texte libre affiché sur la page du rendu.
```

> **La classe est celle du moment du projet.** Elle est portée par l'étudiant
> à l'intérieur du rendu, pas par une fiche étudiant globale : la même personne
> apparaît en B2 en 2025 et en B3 en 2026, ce qui est historiquement juste.

Une erreur de saisie (sujet inexistant, champ manquant, URL invalide) fait
échouer `npm run build` avec le nom du fichier fautif — le site en ligne n'est
jamais cassé par une fiche mal remplie.

## Où poser les fichiers

| Type | Emplacement | Note |
|---|---|---|
| Couvertures | `src/assets/covers/` | optimisées automatiquement au build |
| PDF, images, vidéos, sites | `public/rendus/<année>/<projet>/` | servis tels quels, chemin commençant par `/rendus/…` |

Les pages HTML des étudiants tournent dans une iframe isolée : elles ne peuvent
ni naviguer la page hôte, ni accéder à son stockage.

### Compresser une vidéo avant de l'ajouter

Une vidéo non compressée fait gonfler le dépôt et se charge mal. Viser moins de
50 Mo par fichier (limite de Git).

```bash
ffmpeg -i source.mov -vcodec libx264 -crf 26 -preset slow -vf "scale=-2:1080" -acodec aac -b:a 128k film.mp4
```

`ffmpeg` s'installe avec `brew install ffmpeg`.

---

## Repères techniques

| Fichier | Rôle |
|---|---|
| `src/content.config.ts` | schémas des sujets et des rendus — la source de vérité des champs |
| `src/styles/global.css` | jetons de couleur, échelle typographique, grain |
| `src/scripts/subject-preview.ts` | vignette WebGL qui suit le curseur sur l'accueil |
| `src/scripts/reveal.ts` | apparition des blocs à l'entrée dans l'écran |
| `src/components/Media.astro` | affichage d'un média, un cas par type |

Toutes les animations se coupent sous `prefers-reduced-motion`, et la vignette
WebGL ne démarre pas sur écran tactile : les lignes restent de simples liens.
