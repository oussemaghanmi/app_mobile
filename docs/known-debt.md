# Dette connue

Chaque raccourci pris volontairement : où, pourquoi, ce qu'il faut pour le corriger.

| # | Où | Pourquoi | Pour corriger |
|---|---|---|---|
| 1 | Types de base de données | Non générés : `supabase gen types` exige la CLI et Docker, absents de l'environnement de développement initial. Le front utilise des interfaces écrites à la main. | Générer `frontend/src/lib/database.types.ts` depuis une base locale, le committer, et ajouter à `supabase.yml` une étape qui échoue si le fichier est périmé. |
| 2 | `supabase.yml`, `android.yml`, `supabase/config.toml` | Écrits et validés (`actionlint`, YAML) mais jamais exécutés : pas de Docker ni de SDK Android à l'écriture. Les tests SQL ont tourné sur PostgreSQL 16 avec un faux schéma `auth`. | Lire le premier run de CI et corriger si besoin. |
| 3 | Protection de branche GitHub | Non configurable depuis le dépôt. | La propriétaire active : PR obligatoire, checks `frontend`, `database`, `gitleaks` requis, pas de force-push sur `main` et `develop`. |
| 4 | Vitest 3 et jest-dom 6 | Vitest 5 exige Vite ≥ 6 ; le projet reste sur Vite 5 (CLAUDE.md). | Monter Vite, Vitest et jest-dom ensemble (ADR). |
| 5 | ESLint 9 | ESLint 10 existe mais les plugins React/a11y ne le déclarent pas encore. | Migrer quand les plugins le supportent. |
| 6 | `Settings` : `confirm()` natif et « Supprimer le journal » | Le bouton supprime aussi les symptômes ; la confirmation native n'est ni stylée ni accessible. | Lot 2 : boîte de dialogue traduite, libellés explicites. |
| 7 | `Home` : date du jour en UTC | `toISOString()` donne la date UTC alors que l'application vit à l'heure de Tunis. Autour de minuit, l'humeur peut être rangée au mauvais jour. | Lot 2 : utilitaire de date `Africa/Tunis` partagé. |
| 8 | Aucun compte Supabase ni secret | Pas encore créés. | La propriétaire crée le projet, ajoute `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`, `SUPABASE_DB_PASSWORD`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`. |
