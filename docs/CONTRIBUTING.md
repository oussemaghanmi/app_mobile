# Contribuer à CronCare

## Mise en route

```bash
git clone https://github.com/oussemaghanmi/app_mobile.git
cd app_mobile/frontend
npm ci
cp .env.example .env     # URL et clé anon Supabase (jamais la clé service_role)
npm run dev              # http://localhost:5173
```

Identité git : configurer **votre** nom et **votre** e-mail (`git config user.name`, `git config user.email`).

## Branches
- `main` — version stable (démo / soutenance). Jamais de commit direct, jamais de `push --force`.
- `develop` — intégration.
- `feature/<sujet>` — une branche par écran ou fonctionnalité, ex. `feature/ecran-medicaments`.

```bash
git checkout develop
git pull
git checkout -b feature/ecran-medicaments
# ... travail ...
git add <fichiers>
git commit -m "feat(medicaments): liste des prescriptions du patient"
git push -u origin feature/ecran-medicaments
# puis ouvrir une Pull Request vers develop sur GitHub
```

## Messages de commit (Conventional Commits, en français)
`feat:` nouvelle fonctionnalité · `fix:` correction · `style:` UI/design · `docs:` documentation ·
`refactor:` restructuration · `test:` tests · `ci:` pipeline · `chore:` config, dépendances.

## Avant chaque commit

```bash
cd frontend && npm run check      # lint, format, i18n, RTL, typecheck, tests, build
scripts/test-db-local.sh          # si vous touchez à supabase/ (PostgreSQL 16 + pgTAP, sans Docker)
```

`npm run format` corrige la mise en forme. Avec Docker, `supabase start` puis `supabase test db` donnent le
même résultat que la CI.

## Règles
- Ne jamais committer `.env` ni la clé `service_role`.
- **Base** : ne jamais modifier une migration déjà commitée. Toute nouvelle table : RLS activé + policies + tests
  pgTAP dans `supabase/tests/database/`, dans une **nouvelle** migration (`0003_…`).
- `private_journal` n'est jamais exposé à un soignant, ni par une vue, une fonction, une Edge Function ou un LLM.
- Tout nouveau texte visible : `t('…')` et la clé dans les 4 fichiers de `frontend/src/i18n/locales/` (vraie traduction).
- Classes Tailwind logiques (`ms-`, `pe-`, `start-`, `text-start`…), jamais `ml-`/`pr-`/`left-`/`text-left`.
- Accessibilité : cibles tactiles ≥ 44 px, `aria-label` sur les boutons icônes, contrastes suffisants.
- Contenu médical : général, jamais de posologie inventée, marqué `// TODO(validation-médicale)`.
- Toute suppression définitive demande une confirmation explicite.
- Décision structurante : un ADR court dans `docs/adr/`. Raccourci volontaire : une ligne dans `docs/known-debt.md`.

## Protection des branches (à configurer par la propriétaire du dépôt)
Settings → Branches → règles pour `main` et `develop` : Pull Request obligatoire, checks requis
(`frontend`, `database`, `gitleaks`), force-push et suppression interdits.
