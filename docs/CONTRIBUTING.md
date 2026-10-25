# Workflow Git

## Branches
- `main` — version stable (démo / soutenance). Jamais de commit direct.
- `develop` — intégration.
- `feature/<sujet>` — une branche par écran ou fonctionnalité, ex. `feature/ecran-medicaments`.

```bash
git checkout develop
git pull
git checkout -b feature/ecran-medicaments
# ... travail ...
git add .
git commit -m "feat(medicaments): liste des prescriptions du patient"
git push -u origin feature/ecran-medicaments
# puis ouvrir une Pull Request vers develop sur GitHub
```

## Messages de commit (Conventional Commits)
`feat:` nouvelle fonctionnalité · `fix:` correction · `style:` UI/design · `docs:` documentation ·
`refactor:` restructuration · `chore:` config, dépendances.

## Règles
- Ne jamais committer `.env` ni la clé `service_role`.
- Toute nouvelle table : activer le RLS + écrire ses policies **dans une nouvelle migration** (`0002_...sql`).
- Tout nouveau texte visible : ajouter la clé dans les 4 fichiers de `src/i18n/locales/`.
