# ADR 0001 — Un dossier par partie du dépôt

Date : 2026-11-20 · Statut : acceptée

**Contexte.** La racine mélangeait l'application, la base, la documentation et la configuration. Les tests
SQL, les Edge Functions et le projet Android allaient s'y ajouter.

**Décision.** `frontend/` (React + Capacitor), `supabase/` (base, tests, fonctions), `docs/`, `scripts/`, `.github/`.
Une CI par partie. Pas de workspaces npm : une seule application, un seul `package.json`.

**Conséquences.** Les commandes npm se lancent depuis `frontend/`. Si un second client JavaScript apparaît,
on pourra extraire un paquet partagé (nouvel ADR).
