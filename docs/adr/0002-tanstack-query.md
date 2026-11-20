# ADR 0002 — TanStack Query pour les données serveur

Date : 2026-11-20 · Statut : proposée (adoptée au lot 2, à la première fonctionnalité qui lit des données)

**Contexte.** Les écrans actuels appellent Supabase dans des `useEffect`, sans cache ni gestion homogène des
états de chargement, d'erreur et de rafraîchissement.

**Décision.** Ajouter `@tanstack/react-query` au-dessus du client Supabase, un hook par requête dans
`features/<nom>/api/`. C'est une bibliothèque, pas un changement de pile.

**Conséquences.** Une dépendance de plus ; en échange, états uniformes, cache et invalidation après écriture.
