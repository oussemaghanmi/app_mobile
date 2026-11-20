# Architecture de CronCare

Référence unique de l'organisation du dépôt. Toute décision structurante nouvelle donne lieu à un ADR
court dans `docs/adr/`.

## Vue d'ensemble

```
┌────────────────────────┐        HTTPS (JWT)         ┌──────────────────────────────┐
│ App mobile (Capacitor) │ ─────────────────────────▶ │ Supabase                     │
│ React + TypeScript     │                            │  Auth · PostgreSQL + RLS     │
│ i18n fr/en/ar/tn (RTL) │ ◀───────────────────────── │  Edge Functions (CrohnBot)   │
└────────────────────────┘                            └──────────────────────────────┘
```

Il n'y a **pas de serveur applicatif** : le client parle directement à Supabase. La sécurité est donc
entièrement portée par la base (Row Level Security) ; l'interface ne fait que masquer ce qui est interdit.

## Arborescence

| Dossier | Rôle |
|---|---|
| `frontend/` | Application React + Capacitor (`package.json`, Vite, ESLint, Vitest, projet Android natif dans `android/`) |
| `frontend/src/app` | Routeur, providers, layouts *(à créer au lot 2)* |
| `frontend/src/auth` | `AuthProvider`, `RequireRole`, matrice `permissions.ts` (adapte l'UI seulement) |
| `frontend/src/screens` | Écrans actuels (migrés vers `features/` au lot 2) |
| `frontend/src/features/<nom>` | Cible : une fonctionnalité = ses composants, son accès aux données, ses tests |
| `frontend/src/components` | Composants partagés (navigation, futur design system `ui/`) |
| `frontend/src/i18n` | Configuration i18next et `locales/{fr,en,ar,tn}.json` |
| `frontend/src/lib` | Client Supabase et utilitaires |
| `supabase/migrations` | Schéma et policies. `0001` est figée ; chaque changement = nouvelle migration |
| `supabase/tests/database` | Tests pgTAP des règles d'accès (un fichier par domaine) |
| `supabase/functions` | Edge Functions *(CrohnBot, lot 6)* |
| `supabase/seed.sql` | Données de démonstration locales |
| `scripts/` | Contrôles i18n et RTL, lancement des tests SQL sans Docker |
| `docs/` | Cette documentation, ADR, feuille de route, dette connue, spécifications et plans |
| `.github/` | Workflows CI/CD, modèles d'issue et de PR, CODEOWNERS, Dependabot |

## Modèle de sécurité (RBAC)

Trois rôles (`patient`, `doctor`, `nurse`) dans `profiles.role`. Un compte créé est toujours `patient` ;
la promotion se fait par un administrateur (clé `service_role`, jamais dans le front).

- **Affectation** : `care_assignments(patient_id, professional_id)`. `is_assigned_to()` n'est vraie que si
  le professionnel a bien le rôle `doctor` ou `nurse`.
- **Patient** : lit et écrit ses propres données. Il coche ses prises (`status`, `taken_at` seulement).
- **Médecin affecté** : lit le dossier, crée et modifie les prescriptions de ses patients.
- **Infirmier affecté** : lit le dossier, rédige/modifie/supprime ses propres observations.
- **`private_journal`** : lisible et modifiable par son patient uniquement. Un test pgTAP vérifie qu'aucune
  vue ni fonction ne le référence et que sa policy ne dépend que de `patient_id = auth.uid()`.
- **Visiteur non connecté (`anon`)** : aucun accès aux tables ni aux fonctions.
- Les droits **par colonne** empêchent de changer son rôle, de déplacer une prise ou de réattribuer une prescription.

Détail et preuves : `supabase/migrations/0002_durcissement_rls.sql` et `supabase/tests/database/`.

## Prises médicamenteuses

Les prises ne sont pas saisies par le client : elles sont **générées dans la base** à partir de la prescription
(`generate_intakes`, déclenchée à l'insertion/modification d'une prescription, et `refresh_my_intakes()` appelée
par le patient à l'ouverture de l'app pour compléter l'horizon de 14 jours).

- Fuseau de l'application : `Africa/Tunis` (les horaires `time` sont des heures locales).
- On ne crée jamais de prise déjà passée.
- Modifier les horaires recalcule les prises futures en attente ; l'historique (prises cochées) est conservé.

## Internationalisation

`fr` (défaut), `en`, `ar`, `tn` (darija). `ar` et `tn` passent `<html dir="rtl">` (voir `applyLanguage`).
`scripts/check-i18n.mjs` impose les mêmes clés partout, aucune valeur vide, les mêmes variables `{{x}}` et une
vraie traduction (pas de copie du français). `scripts/check-rtl.mjs` interdit les classes Tailwind physiques
(`ml-`, `pr-`, `left-`, `text-left`…) au profit des classes logiques (`ms-`, `pe-`, `start-`, `text-start`…).

## Qualité et pipeline

Un contrôle local unique : `cd frontend && npm run check` (lint, format, i18n, RTL, typecheck, tests, tests des scripts, build).
Base : `scripts/test-db-local.sh` (PostgreSQL 16 + pgTAP, sans Docker) ou `supabase test db`.

| Workflow | Déclencheur | Rôle |
|---|---|---|
| `frontend.yml` | PR et push `develop`/`main` | `npm run check` découpé en étapes |
| `supabase.yml` | idem | `supabase start`, rejeu des migrations + seed, lint du schéma, tests pgTAP |
| `secrets.yml` | idem | gitleaks |
| `android.yml` | push `develop`/`main` | build web, `cap sync`, APK debug en artefact |
| `deploy-supabase.yml` | push `main` | migrations + Edge Functions ; inactif tant que les secrets `SUPABASE_*` sont absents |

Branches : `feature/<sujet>` → PR vers `develop` → PR `develop` → `main` + tag `v0.x.0`.

## Ce qui n'existe pas encore

Voir `docs/roadmap.md` (écrans, rappels, espace soignant, CrohnBot) et `docs/known-debt.md` (raccourcis assumés).
