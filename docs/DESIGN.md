# Système de design CronCare

Référence du design depuis l'ADR-0008 (pas d'export Figma). Toute évolution visuelle passe par les jetons
et les composants ci-dessous, jamais par des valeurs en dur dans un écran.

## Couleurs (`src/styles/index.css`, bloc `@theme`)

| Jeton | Valeur | Usage | Contraste |
|---|---|---|---|
| `sage` | `#7A9E7E` | marque : surfaces teintées (`bg-sage/10`, `/20`), bordures, décor | 3,0:1, **pas de petit texte** |
| `sage-dark` | `#4A6B4E` | texte d'accent, boutons principaux (texte blanc), onglet actif | 6,0:1 blanc · 5,5:1 crème |
| `terracotta` | `#C8775A` | marque : bordures d'alerte, teintes (`bg-terracotta/10`) | 3,4:1, **pas de petit texte** |
| `terracotta-dark` | `#A8573A` | texte d'alerte et d'erreur, bouton d'urgence (texte blanc) | 5,1:1 blanc · 4,8:1 crème |
| `cream` | `#FAF6EF` | fond de l'application | — |
| `ink` | `#2F3A33` | texte ; `text-ink/70` pour le texte secondaire (minimum) | 11,8:1 · `/70` : 4,6:1 |

Règle : du texte sur fond clair utilise `ink`, `ink/70`, `sage-dark` ou `terracotta-dark` ; jamais `sage`,
`terracotta` ni `ink` en dessous de 70 %. Les bordures de champ utilisent `ink/55` (≥ 3:1).

## Typographie
- Titres `h1`, `h2` : **Lora** (`font-serif`) ; texte : **DM Sans** ; arabe : police système (Noto Sans Arabic sur Android).
- `h1` écran `text-2xl`, titre de carte `h2`/`h3` `text-lg`. Une seule `h1` par écran (`ScreenHeader`).

## Composants partagés (`src/components/ui/`)

| Composant | Rôle |
|---|---|
| `ScreenHeader` | retour (flèche retournée en RTL), `h1`, sous-titre, action |
| `Icon` | jeu d'icônes maison (traits 24 px) ; `flip` pour les flèches en RTL ; toujours `aria-hidden` |
| `Logo` | logo (deux feuilles sauge/terracotta en cœur) ; décoratif, le nom est écrit à côté |
| `Tabs` | onglets WAI-ARIA (flèches inversées en RTL) |
| `Accordion` | section repliable (`aria-expanded`), `highlight` = bordure terracotta |
| `MedicalNotice`, `EmergencyNotice` | rappel « information générale » et encadré signes d'alerte + appel du 190 |

Classes utilitaires (`index.css`) : `.card`, `.btn` (principal), `.btn-danger` (action définitive, toujours
avec confirmation), `.input`. Toutes font au moins 44 px de haut.

## Règles d'interface
- **Cibles tactiles ≥ 44 px** (`min-h-11`) ; navigation basse 64 px.
- **RTL** : propriétés logiques uniquement (`ms-`, `pe-`, `start-`, `text-start`…), icônes directionnelles avec `flip`.
- **Focus visible** : contour `sage-dark` de 3 px sur `:focus-visible` (défini globalement).
- **Champs** : un `<label>` visible pour chaque champ ; le `placeholder` n'est qu'un exemple.
- **Erreurs** : `role="alert"`, couleur `terracotta-dark`.
- **Emojis** : réservés au contenu (humeur, recettes) ; la navigation et les actions utilisent `Icon`.

## Vérifier visuellement
`npm run dev`, puis émulation mobile (390 × 844) dans le navigateur, en `fr` puis en `ar`.
