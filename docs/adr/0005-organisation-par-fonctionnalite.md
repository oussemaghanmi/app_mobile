# ADR-0005 — Code front organisé par fonctionnalité, avec une couche `api.ts`

**Statut :** Accepté

## Contexte
Le squelette initial rangeait le code par type (`screens/`, `auth/`), avec des appels `supabase`
directement dans les composants. Avec une dizaine d'écrans à migrer depuis Figma, cela disperse l'accès
aux données, rend les composants difficiles à tester et cache les requêtes faites à la base.

## Décision
- `src/features/<nom>/` avec `components/`, `api.ts`, `hooks.ts`, `types.ts` et les tests à côté.
- `api.ts` est le **seul** endroit qui importe `@/lib/supabase`. C'est imposé par ESLint
  (`no-restricted-imports`).
- Client typé `createClient<Database>` à partir de `src/lib/database.types.ts`, généré.
- États chargement / erreur / vide homogènes via `useAsync` et `<AsyncView>`.

## Conséquences
- ✅ Chaque écran migré depuis Figma suit le même gabarit. Les requêtes sont faciles à relire et à mocker.
- ✅ Une modification du schéma casse la compilation là où il faut, après `npm run db:types`.
- ⚠️ Un peu plus de fichiers par fonctionnalité.
