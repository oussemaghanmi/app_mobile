# ADR-0007 — Le visiteur non connecté (`anon`) n'a aucun droit sur `public`

Statut : Accepté · Date : 2026-11-20

## Contexte
Supabase accorde par défaut aux rôles API (`anon`, `authenticated`) tous les droits sur les objets du schéma
`public` ; c'est le RLS qui filtre. Plusieurs policies (0001 à 0010) ont été écrites sans clause `to`, donc
elles s'appliquaient aussi à `anon`, et `anon` pouvait exécuter des fonctions comme `my_role()`. Aucune donnée
ne fuyait (les policies rendent 0 ligne), mais la seule barrière était l'absence de bug dans chaque policy.

## Décision
- Migration `0011_durcissement_acces.sql` : retrait de tous les droits de `anon` sur les tables, séquences et
  fonctions de `public`, y compris par défaut pour les objets futurs.
- Les policies existantes passent à `to authenticated` (`alter policy`).
- Les fonctions de trigger ne sont plus appelables depuis l'API.
- Le test `supabase/tests/securite_generale.test.sql` échoue si une table n'a pas de RLS, si `anon` retrouve un
  droit, si une policy vise un autre rôle que `authenticated`, ou si `private_journal` est référencé par une
  vue ou une fonction.

## Conséquences
- L'application n'a aucun besoin de lire des données avant la connexion ; si un contenu public devenait
  nécessaire, il faudrait un nouvel ADR et une policy `to anon` explicite, testée.
- Toute future fonction ou table hérite de ce comportement ; le test transversal le garantit.
