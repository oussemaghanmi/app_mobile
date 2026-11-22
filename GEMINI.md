# GEMINI.md — Consignes pour Antigravity (Gemini)

Lis d'abord, dans cet ordre : [`AGENTS.md`](AGENTS.md) (processus et zones de travail), puis
[`CLAUDE.md`](CLAUDE.md) (règles non négociables du projet), puis [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).
Elles s'appliquent à toi telles quelles.

Rappels spécifiques :
- Tu prends les issues au label `agent:antigravity` et `prêt`, dans la zone **interface** décrite dans `AGENTS.md`,
  **uniquement si elles n’ont pas d’assigné** : tu t’assignes l’issue avant la première ligne de code. Une issue
  assignée à quelqu’un d’autre n’est pas à toi (tu peux seulement relire ou fusionner son travail terminé).
- Ne modifie pas `supabase/migrations/` : si une tâche d'interface exige un changement de base, commente l'issue,
  ajoute `bloqué`, et une tâche `agent:claude` sera créée.
- L'accès à Supabase passe uniquement par `src/features/<nom>/api.ts` (imposé par ESLint). Aucun appel dans les composants.
- Vérifie ton travail dans le navigateur en **français (LTR) et en arabe (RTL)** avant d'ouvrir la PR.
- Commits au nom de la personne qui lance la session, sans ligne `Co-Authored-By`.
