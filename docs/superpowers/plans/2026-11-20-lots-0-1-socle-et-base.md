# Lots 0 et 1 — socle du dépôt et base de données — plan d'implémentation

> **Pour les agents :** sous-compétence requise : superpowers:executing-plans. Les étapes utilisent des cases `- [ ]`.

**Objectif :** ranger le dépôt en un dossier par partie, doter le front d'outils de qualité et le dépôt d'une CI complète, durcir le schéma SQL (migration `0002`) et le prouver avec des tests pgTAP.

**Architecture :** `frontend/` (app React + Capacitor), `supabase/` (migrations, tests, seed), `scripts/` (contrôles i18n et RTL), `docs/`, `.github/`. La CI s'exécute par partie. Les tests RLS tournent avec la CLI Supabase en CI et, dans cet environnement sans Docker, sur un PostgreSQL 16 local avec un faux schéma `auth`.

**Pile :** React 18, TypeScript, Vite 5, Tailwind v4, Vitest, Testing Library, ESLint 9, Prettier, PostgreSQL 16 + pgTAP, Supabase CLI, GitHub Actions.

**Spec :** `docs/superpowers/specs/2026-11-20-fondations-design.md`

## Contraintes globales
- Migrations déjà commitées jamais modifiées : tout changement SQL va dans `0002_…`.
- RLS activé sur toute table ; `private_journal` lisible par son seul propriétaire.
- Aucun secret dans le front ni dans Git ; seules `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` côté client.
- Aucun texte visible en dur ; clés identiques dans les 4 fichiers `fr/en/ar/tn`.
- Classes Tailwind logiques uniquement (`ms-/me-/ps-/pe-/start-/end-`), jamais `ml-/mr-/pl-/pr-/left-/right-/text-left/text-right`.
- Commits : Conventional Commits en français, auteur Amal Ketata, sans `Co-Authored-By`.
- Aucun contenu médical inventé.

## Points de vigilance (Review Focus)
1. Un utilisateur non connecté (`anon`) ne lit ni n'écrit aucune table (test pgTAP, tâche 5).
2. Un médecin non affecté ne voit aucune donnée d'un patient (tâche 5).
3. Un patient ne peut pas décaler une prise (`scheduled_at`) ni la rattacher à une autre prescription (tâche 5).
4. Un fichier de langue avec une clé vide ou manquante fait échouer `check-i18n` (tâche 3).
5. Un chemin cassé par le déplacement vers `frontend/` fait échouer `npm run build` (tâche 1).

## Fichiers
- Déplacés : `src/`, `index.html`, `vite.config.ts`, `tsconfig.json`, `capacitor.config.ts`, `package*.json`, `.env.example` → `frontend/`
- Créés : `frontend/eslint.config.js`, `frontend/.prettierrc.json`, `frontend/vitest.config.ts`, `frontend/src/test/setup.ts`, `scripts/check-i18n.mjs`, `scripts/check-rtl.mjs`, `scripts/test-db-local.sh`, `supabase/config.toml`, `supabase/migrations/0002_durcissement_rls.sql`, `supabase/tests/*.sql`, `.github/**`, `docs/**`

---

### Tâche 1 : déplacer le front dans `frontend/`
**Fichiers :** déplacer comme ci-dessus ; modifier `.gitignore`, `.env.example` (chemin) ; supprimer `tsconfig.tsbuildinfo` du suivi.
**Interfaces :** produit `frontend/` autonome (`npm ci && npm run build` depuis ce dossier).
- [ ] **Étape 1 :** `git mv` des fichiers listés ; `git rm --cached tsconfig.tsbuildinfo` ; ajouter `*.tsbuildinfo` à `.gitignore`.
- [ ] **Étape 2 :** dans `frontend/`, lancer `npm ci && npm run typecheck && npm run build`. Attendu : succès.
- [ ] **Étape 3 :** commit `refactor: déplacer l'application dans frontend/`.

### Tâche 2 : outillage de qualité du front
**Fichiers :** `frontend/package.json`, `eslint.config.js`, `.prettierrc.json`, `vitest.config.ts`, `src/test/setup.ts`, `src/auth/permissions.test.ts`.
**Interfaces :** produit les scripts `lint`, `format`, `format:check`, `test`, `typecheck`, `build`.
- [ ] **Étape 1 (test) :** `permissions.test.ts` : `can('patient','prescriptions:write') === false`, `can('doctor','prescriptions:write') === true`, `can(undefined,'education:view') === false`, `can('nurse','private_journal:use') === false`, `homePathFor('doctor') === '/doctor'`.
- [ ] **Étape 2 :** installer vitest, jsdom, @testing-library/react, @testing-library/jest-dom, eslint 9, typescript-eslint, eslint-plugin-react-hooks, eslint-plugin-jsx-a11y, prettier ; écrire les configs ; ajouter les scripts.
- [ ] **Étape 3 :** `npm test` (tests verts), `npm run lint` et `npm run format:check` (corriger les écarts du code existant sans changer son comportement).
- [ ] **Étape 4 :** commit `chore(front): lint, format et tests (ESLint, Prettier, Vitest)`.

### Tâche 3 : contrôles i18n et RTL
**Fichiers :** `scripts/check-i18n.mjs`, `scripts/check-rtl.mjs`, `scripts/__tests__/*.test.mjs` (node:test), scripts npm `check:i18n`, `check:rtl`.
**Interfaces :** `checkI18n(dir: string): string[]` et `checkRtl(srcDir: string): string[]` renvoient la liste des erreurs ; code de sortie 1 si non vide.
- [ ] **Étape 1 (tests) :** i18n : clé manquante dans `ar` → erreur ; valeur vide → erreur ; `tn` identique à `fr` pour une même clé → erreur. RTL : `className="ml-2"` → erreur ; `ms-2` → pas d'erreur.
- [ ] **Étape 2 :** implémenter les deux fonctions ; les brancher sur `frontend/src`.
- [ ] **Étape 3 :** `node --test scripts` vert ; `npm run check:i18n && npm run check:rtl` sur le code existant (corriger les écarts de traduction ou de classes).
- [ ] **Étape 4 :** commit `ci: contrôles i18n et RTL`.

### Tâche 4 : environnement de test SQL local
**Fichiers :** `supabase/config.toml`, `supabase/seed.sql` (déplacé), `scripts/test-db-local.sh`, `supabase/tests/_helpers.sql`.
**Interfaces :** `scripts/test-db-local.sh` démarre un PostgreSQL temporaire, crée les rôles `anon`/`authenticated`, un schéma `auth` factice (`auth.users`, `auth.uid()` lisant `request.jwt.claim.sub`), applique les migrations, lance `pg_prove`. Les helpers de test exposent `tests.create_user(uuid, role)` et `tests.login_as(uuid)`.
- [ ] **Étape 1 :** écrire le script et les helpers ; appliquer `0001` seule.
- [ ] **Étape 2 :** lancer un test pgTAP trivial (`select ok(true)`). Attendu : PASS.
- [ ] **Étape 3 :** commit `test(db): environnement pgTAP local`.

### Tâche 5 : migration `0002` et tests RLS
**Fichiers :** `supabase/migrations/0002_durcissement_rls.sql`, `supabase/tests/rls_*.test.sql`.
**Interfaces :** produit `public.generate_intakes(p_prescription uuid, p_days int default 14) returns int` (security definer, crée les prises pour les horaires de la prescription) et un trigger `after insert` sur `prescriptions` qui l'appelle.
- [ ] **Étape 1 (tests, avant la migration) :** pour chaque table, matrice rôle × opération (patient, patient tiers, médecin affecté, médecin non affecté, infirmier affecté, anonyme). Assertions clés : `anon` ne lit rien ; `private_journal` invisible pour médecin/infirmier/patient tiers ; un patient ne peut pas faire `update profiles set role='doctor'` ; un patient ne peut pas modifier `scheduled_at` ni `prescription_id` d'une prise mais peut modifier `status` et `taken_at` ; `prescribed_by` et `patient_id` d'une prescription non modifiables ; médecin non affecté ne peut ni lire ni prescrire ; l'infirmier modifie et supprime ses observations mais pas celles d'un autre ; créer une prescription crée des prises pour 14 jours.
- [ ] **Étape 2 :** lancer les tests : ils échouent (prises non créées, colonnes modifiables…).
- [ ] **Étape 3 :** écrire `0002` : `generate_intakes` + trigger ; droits par colonne sur `medication_intakes` (update limité à `status`, `taken_at`) et trigger interdisant le changement de `patient_id`/`prescribed_by` ; `is_assigned_to` exigeant un rôle soignant ; policies `nursing_notes` update/delete ; `revoke execute … from anon`.
- [ ] **Étape 4 :** relancer : tous les tests passent ; relancer aussi sur base vide pour vérifier que `0001` puis `0002` s'appliquent.
- [ ] **Étape 5 :** commit `feat(db): durcissement RLS et génération des prises (0002)`.

### Tâche 6 : pipeline GitHub
**Fichiers :** `.github/workflows/{frontend,supabase,android,deploy-supabase,secrets}.yml`, `.github/{CODEOWNERS,dependabot.yml,pull_request_template.md}`, `.github/ISSUE_TEMPLATE/*.yml`.
- [ ] **Étape 1 :** écrire les workflows selon le §6.4 de la spec (déclencheurs `pull_request` vers `develop`/`main` et `push`) ; `deploy-supabase.yml` ne s'exécute que si les secrets existent.
- [ ] **Étape 2 :** valider la syntaxe YAML (`python -c yaml.safe_load`) et relire chaque commande contre les scripts réels.
- [ ] **Étape 3 :** commit `ci: pipeline frontend, supabase, android, déploiement`.

### Tâche 7 : documentation
**Fichiers :** `docs/ARCHITECTURE.md`, `docs/adr/0001-structure-en-dossiers.md`, `0002-tanstack-query.md`, `0003-tests-pgtap.md`, `docs/roadmap.md`, `docs/known-debt.md`, `docs/CONTRIBUTING.md` (mis à jour), `README.md`, `CLAUDE.md` (chemins).
- [ ] **Étape 1 :** rédiger ; la dette connue note : types DB non générés (nécessite Docker/Supabase CLI), protection de branche à configurer par la propriétaire.
- [ ] **Étape 2 :** vérifier que tous les chemins cités existent (`git ls-files`).
- [ ] **Étape 3 :** commit `docs: architecture, ADR, feuille de route`.

### Tâche 8 : vérification finale du lot
- [ ] Depuis une copie propre : `cd frontend && npm ci && npm run lint && npm run format:check && npm run check:i18n && npm run check:rtl && npm run typecheck && npm test && npm run build` ; `node --test scripts` ; `scripts/test-db-local.sh`. Tout doit passer ; sinon corriger avant de pousser.
- [ ] Pousser la branche de session.
