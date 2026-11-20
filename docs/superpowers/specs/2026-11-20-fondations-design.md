# Fondations de CronCare — design

Statut : **en attente d'approbation** · Date : 2026-11-20 · Auteure : Amal Ketata

## 1. Intention

CronCare accompagne les patients atteints de la maladie de Crohn en Tunisie (projet de fin d'études
en soins infirmiers). Le dépôt contient un squelette fonctionnel (auth + RBAC, accueil patient,
paramètres, tableau de bord soignant) mais ses bases ne sont pas tenues : le pipeline n'exécute que
`build`, les scripts `lint`/`test` exigés par CLAUDE.md n'existent pas, la documentation
d'architecture est absente et le schéma SQL comporte des trous. Le prototype Figma n'est **pas**
disponible. Objectif : un socle propre, testé et automatisé, sur lequel chaque écran s'ajoute sans
dette. Pourquoi maintenant : chaque écran écrit avant ce socle devra être refait.

## 2. Objectifs, non-objectifs, anti-objectifs

**Objectifs**
- Arborescence claire, une partie = un dossier, inspirée de `agentic-mlops-pipeline`.
- Une CI qui fait échouer toute régression : qualité du code, i18n (4 langues), RTL, schéma SQL, **règles RLS**.
- Une base de données dont les règles d'accès sont prouvées par des tests automatisés.
- Documentation vivante : architecture, ADR, feuille de route, dette connue.
- Toutes les règles non négociables de CLAUDE.md appliquées mécaniquement quand c'est possible.

**Non-objectifs**
- Pas de changement de stack (React, Vite, Tailwind v4, Capacitor 7, Supabase, i18next).
- Pas de publication sur le Play Store, pas d'iOS pour l'instant.
- Pas de contenu médical inventé.

**Anti-objectifs (échec même si « ça marche »)**
- Un soignant qui peut lire `private_journal`, ou un patient qui peut se promouvoir médecin.
- Un secret ou la clé `service_role` dans le front ou dans Git.
- Un texte en dur, une classe `ml-`/`pr-`/`left-` ou une migration déjà commitée modifiée.

## 3. Contraintes

- CLAUDE.md : migrations jamais modifiées (nouvelles `0002_…`), RLS sur toute table, 4 langues avec
  vraie traduction, contenu médical marqué `// TODO(validation-médicale)`, confirmation avant suppression.
- Aucun compte Supabase ni secret GitHub n'existe encore : tout doit tourner en **local** (Docker +
  Supabase CLI) et le déploiement reste inactif tant que les secrets sont absents.
- Pas de maquette Figma : les écrans suivent les descriptions du README et le thème sauge / terracotta / crème.
- Identité git : tous les commits sont au nom d'**Amal Ketata**, sans ligne `Co-Authored-By`.

## 4. Approches envisagées

| | Description | Compromis |
|---|---|---|
| A. Durcir sur place | `src/` reste à la racine, on ajoute l'outillage | Peu de changements ; la racine mélange app, base, docs et config |
| **B. Un dossier par partie (retenue)** | `frontend/`, `supabase/`, `docs/`, `.github/`, `scripts/` | Même logique que la référence ; CI par partie ; chemins à mettre à jour dans CLAUDE.md et README |
| C. Workspaces npm + paquet partagé | B + paquet TypeScript commun | Surdimensionné avec une app et une base ; ajoutable plus tard (ADR) |

Choix : **B**, décidé par l'auteure du design à la demande de la contributrice (« décide pour moi »).

## 5. Architecture cible

```
.
├── frontend/                  App React + Capacitor (package.json, vite, eslint, vitest, capacitor.config.ts)
│   └── src/
│       ├── app/               routeur, providers, garde RequireRole, layouts
│       ├── features/<nom>/    auth, home, medications, disease, recipes, tips, community,
│       │                      journal, calendar, settings, pro, crohnbot
│       │   ├── components/    UI propre à la fonctionnalité
│       │   ├── api/           requêtes Supabase + hooks TanStack Query
│       │   └── *.test.tsx
│       ├── components/ui/     boutons, cartes, champs (design system, accessibles ≥ 44 px)
│       ├── i18n/              config + locales/{fr,en,ar,tn}.json
│       ├── lib/               client supabase, types DB générés, utilitaires
│       ├── styles/            thème Tailwind (jetons de couleur, polices)
│       └── test/              setup Vitest, fabriques
├── supabase/
│   ├── config.toml
│   ├── migrations/            0001 (figée), 0002_…, 0003_… (une migration par sujet)
│   ├── tests/                 tests pgTAP (matrice rôle × table × opération)
│   ├── functions/crohnbot/    Edge Function (clé LLM dans les secrets Supabase)
│   └── seed.sql               données de démo locales
├── docs/                      ARCHITECTURE.md, CONTRIBUTING.md, adr/, roadmap.md, known-debt.md,
│                              superpowers/{specs,plans}/
├── scripts/                   check-i18n.mjs, check-rtl.mjs
└── .github/                   workflows/, ISSUE_TEMPLATE/, pull_request_template.md, CODEOWNERS, dependabot.yml
```

## 6. Décisions par partie

### 6.1 Base de données (priorité 1)
Nouvelle migration `0002_durcissement_rls.sql`, sans toucher à `0001` :
- `medication_intakes` : aucune policy d'insertion n'existe, donc personne ne peut créer de prise.
  Les prises sont générées côté base à partir de la prescription (fonction `security definer`
  appelée à la création/modification d'une prescription, horizon limité). *Détail à fixer par le plan.*
- Le patient ne peut modifier que `status` et `taken_at` d'une prise (droits par colonne), pas
  `scheduled_at` ni `prescription_id`.
- Prescriptions : `patient_id` et `prescribed_by` non modifiables après création.
- `is_assigned_to` exige que le soignant ait un rôle `doctor` ou `nurse`.
- `nursing_notes` : l'infirmier peut modifier/supprimer **ses** observations pour les patients affectés.
- Révocation de `execute` pour `anon` sur les fonctions utilitaires.
- Tests pgTAP : pour chaque table et chaque rôle (patient, patient tiers, médecin affecté, médecin
  non affecté, infirmier, anonyme), lecture/écriture autorisées ou refusées ; `private_journal`
  invisible pour tout autre que son propriétaire ; impossibilité de changer son propre rôle.
- Nouvelles tables (communauté, etc.) : chacune dans sa migration, avec RLS et tests, au moment où sa fonctionnalité est construite.

### 6.2 Backend (Edge Functions)
- `crohnbot` : exige un JWT valide, n'accède jamais à `private_journal`, ne transmet au LLM que le
  message et un contexte non sensible, limite le débit par utilisateur, répond de façon générale en
  renvoyant au médecin. Fournisseur LLM non choisi : fonction écrite derrière une interface, sans
  clé tant que la contributrice n'en fournit pas (voir §9).

### 6.3 Frontend
- Structure par fonctionnalité (§5). Types de base de données **générés** (`supabase gen types`) et
  vérifiés en CI : le front ne peut pas diverger du schéma.
- Données : TanStack Query au-dessus du client Supabase (cache, états de chargement/erreur
  uniformes). C'est une bibliothèque ajoutée, pas un changement de stack (voir ADR).
- Qualité : ESLint 9 (typescript-eslint, jsx-a11y, react-hooks), Prettier, Vitest + Testing Library.
- Règles CLAUDE.md automatisées : `scripts/check-i18n.mjs` (mêmes clés dans les 4 fichiers, aucune
  valeur vide, `ar`/`tn` différents de `fr`) et `scripts/check-rtl.mjs` (interdit `ml-/mr-/pl-/pr-/left-/right-/text-left/text-right`).
- Écrans : socle UI d'abord (composants accessibles), puis un écran par branche. Les écrans
  « Ma maladie », « Alimentation », « Conseils » n'utilisent que du contenu général marqué
  `// TODO(validation-médicale)`.
- Les `confirm()` natifs des paramètres sont remplacés par une boîte de dialogue accessible traduite.
- Rappels médicamenteux : Capacitor Local Notifications, après l'écran Médicaments.

### 6.4 Pipeline CI/CD (`.github/workflows/`)
Déclenchement : `pull_request` vers `develop` et `main`, et `push` sur `develop`/`main`.
- `frontend.yml` : `npm ci`, lint, format:check, check:i18n, check:rtl, typecheck, test, build.
- `supabase.yml` : Supabase CLI locale, `supabase db lint`, `supabase test db` (pgTAP),
  vérification que les types générés sont à jour.
- `android.yml` (push `develop`/`main`) : JDK 21, build web, `cap sync`, APK debug en artefact.
- `deploy-supabase.yml` (push `main`) : migrations + Edge Functions ; **ignoré proprement** si les
  secrets `SUPABASE_*` sont absents.
- Analyse de secrets (gitleaks), Dependabot, `CODEOWNERS`, modèles d'issue et de PR.
- Protection de branche : non configurable depuis le dépôt ; documentée dans `docs/CONTRIBUTING.md`
  pour la propriétaire du dépôt (checks requis, PR obligatoire, pas de force-push).

### 6.5 Git et documentation
- Flux : `feature/<sujet>` → PR vers `develop` → `develop` → `main` + tag `v0.x.0`.
- Commits : Conventional Commits en français, au nom d'Amal Ketata, sans `Co-Authored-By`.
- `docs/ARCHITECTURE.md` (référence), `docs/adr/0001…` (structure en dossiers, TanStack Query, tests
  pgTAP, génération de types), `docs/roadmap.md`, `docs/known-debt.md`. CLAUDE.md et README mis à jour
  vers les nouveaux chemins.

## 7. Ordre de travail (un lot = une branche = une PR)

0. **Socle dépôt** : déplacer le code dans `frontend/`, `.gitignore` (retirer `tsconfig.tsbuildinfo`),
   scripts lint/test/format/check, workflows, modèles GitHub, documentation.
1. **Base de données** : `0002`, tests pgTAP, seed local, types générés.
2. **Socle frontend** : design system, i18n, auth complète (inscription, connexion), TanStack Query.
3. **Écrans patient** un par un : Médicaments, Journal, Calendrier, Ma maladie, Alimentation, Conseils, Communauté.
4. **Rappels** (Local Notifications).
5. **Espace soignant** : prescriptions (médecin), observations (infirmier).
6. **CrohnBot** (Edge Function + écran).

Chaque lot passe `lint`, `typecheck`, `test`, `build`, les checks i18n/RTL et les tests RLS avant commit.

## 8. Laissé au réalisateur
Noms exacts des composants, choix des bibliothèques de test annexes, détail de la génération des
prises (§6.1), mise en forme des écrans dans le thème existant.

## 9. Points ouverts (à trancher avec la contributrice)
- Création de la branche `develop` à partir de `main` (nécessaire au flux ci-dessus).
- Fournisseur LLM et clé pour CrohnBot (non bloquant avant le lot 6).
- Projet Supabase et secrets GitHub : à créer par la propriétaire du dépôt avant le premier déploiement.
- Absence du prototype Figma : si un export est fourni plus tard, les écrans seront alignés dessus.
