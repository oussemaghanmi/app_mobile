# CLAUDE.md — Contexte permanent du projet CronCare

> Ce fichier est lu automatiquement par Claude Code à chaque session. Il décrit le projet,
> les règles non négociables et la manière de travailler.

## Le projet
CronCare (aussi écrit CrohnCare) est une application mobile d'accompagnement des patients atteints
de la **maladie de Crohn** en Tunisie, issue d'un projet de fin d'études en soins infirmiers.
Un prototype a été réalisé dans **Figma Make** (React/TypeScript) ; l'objectif est d'en faire une
application fonctionnelle en conservant **au maximum le design et la navigation existants**.
L'export du prototype n'est pas dans le dépôt : tant qu'il n'est pas fourni, les écrans suivent le thème et
les descriptions du README (s'il est fourni, le placer dans `frontend/src/figma/` : il redevient la source de vérité du design).

## Stack (déjà en place — ne pas changer sans demander)
- React 18 + TypeScript + Vite 5 + Tailwind CSS v4 (`@tailwindcss/vite`)
- Capacitor 7 (cible principale : Android)
- Supabase : Auth, PostgreSQL, Row Level Security, Edge Functions
- i18next : `fr` (défaut), `en`, `ar`, `tn` (darija tunisienne) — `ar` et `tn` sont en RTL
- Thème : sauge `#7A9E7E`, terracotta `#C8775A`, crème `#FAF6EF`, polices Lora (titres) + DM Sans

## Arborescence
```
frontend/                 application React + Capacitor (npm se lance ici ; projet natif dans android/)
frontend/src/auth/        AuthProvider, RequireRole (garde de routes), permissions.ts (matrice RBAC front)
frontend/src/i18n/        index.ts (applyLanguage gère dir=rtl) + locales/{fr,en,ar,tn}.json
frontend/src/screens/     patient/, shared/ (Settings, ProDashboard, Placeholder), auth/
frontend/src/components/  PatientLayout (navigation basse)
supabase/migrations/      0001 (figée), 0002_durcissement_rls ; nouvelles migrations = 0003_…
supabase/tests/database/  tests pgTAP des règles RLS (obligatoires pour toute nouvelle table)
supabase/functions/       Edge Functions (CrohnBot)
scripts/                  check-i18n.mjs, check-rtl.mjs, test-db-local.sh
docs/                     ARCHITECTURE.md, adr/, roadmap.md, known-debt.md, CONTRIBUTING.md
```

## Rôles (RBAC)
| Rôle | Autorisé | Interdit |
|---|---|---|
| patient | ses médicaments/rappels, humeur, symptômes, journal privé, contenu éducatif, communauté, export/suppression de ses données | modifier une prescription, voir d'autres patients |
| doctor | dossiers des patients **affectés** (`care_assignments`), créer/modifier des prescriptions | journal privé, patients non affectés |
| nurse | infos utiles des patients affectés, rédiger des observations infirmières | prescrire, journal privé |

## Règles NON négociables
1. **La sécurité est dans la base.** Toute nouvelle table : `enable row level security` + policies
   dans une **nouvelle** migration. Ne jamais modifier une migration déjà commitée.
   Le front (`permissions.ts`, `RequireRole`) ne sert qu'à adapter l'interface.
2. **`private_journal` n'est lisible que par le patient.** Aucune policy, vue, fonction ou
   Edge Function ne doit l'exposer à un soignant ni l'envoyer à un LLM.
3. **Aucun secret dans le front ni dans Git** : seules `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`
   côté client. La clé API du LLM et la `service_role` restent dans les secrets Supabase.
4. **Aucun texte en dur** : tout texte visible passe par `t('…')` et la clé est ajoutée
   dans les **4** fichiers de langue (traduction réelle, pas de copie du français).
5. **RTL** : utiliser les propriétés logiques Tailwind (`ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`,
   `border-s`, `text-start`) au lieu de `ml/mr/pl/pr/left/right`.
6. **Accessibilité** : cibles tactiles ≥ 44 px, `aria-label` sur les boutons icônes, contrastes suffisants,
   titres hiérarchisés. Le public peut être âgé ou fatigué.
7. **Contenu médical** : ne jamais inventer de posologie ni de conseil clinique précis. Le contenu
   éducatif reste général et renvoie au médecin. Les textes médicaux à valider par l'équipe sont
   marqués `// TODO(validation-médicale)`.
8. Actions définitives (suppressions) : toujours une confirmation explicite.

## Workflow Git (repo distant : `origin` sur GitHub)
- Une branche par fonctionnalité/écran depuis `develop` : `feature/<sujet>` (ex. `feature/ecran-medicaments`).
- Commits petits, en **Conventional Commits en français** : `feat(medicaments): …`, `fix: …`, `style: …`, `ci: …`.
- Avant chaque commit : `cd frontend && npm run check` (lint, format, i18n, RTL, typecheck, tests, build) et, si `supabase/` change, `scripts/test-db-local.sh`.
- Fin d'une fonctionnalité : `git push -u origin feature/<sujet>` → Pull Request vers `develop` (`gh pr create`)
  → attendre la CI verte (`gh pr checks --watch`) → `gh pr merge --merge --delete-branch`.
- `main` ne reçoit que des PR `develop → main` en fin de lot, suivies d'un tag `v0.x.0`.
- Jamais de push direct sur `main`, jamais de `push --force`, jamais de secret dans un commit.

## Pipeline CI/CD (`.github/workflows/`)
- `frontend.yml` : sur chaque PR et push `develop`/`main` → lint, format, check i18n, check RTL, typecheck, tests, build.
- `supabase.yml` : idem → migrations + seed rejoués, lint du schéma, tests pgTAP (règles RLS).
- `secrets.yml` : gitleaks.
- `android.yml` : sur `develop`/`main` → APK debug en artefact téléchargeable.
- `deploy-supabase.yml` : sur `main` → migrations + Edge Functions vers le projet Supabase (inactif sans secrets).
- Secrets GitHub attendus : `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`, `SUPABASE_DB_PASSWORD`,
  `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.

## Architecture
La référence est `docs/ARCHITECTURE.md` (+ décisions dans `docs/adr/`). Toute décision structurante
nouvelle donne lieu à un ADR court.

## Commandes
```bash
cd frontend
npm run dev        # serveur de dev
npm run check      # contrôle complet (doit passer avant tout commit)
npm run cap:android
../scripts/test-db-local.sh   # tests SQL sans Docker
```
