# ADR 0003 — Les règles d'accès sont prouvées par des tests pgTAP

Date : 2026-11-20 · Statut : acceptée

**Contexte.** Sans serveur applicatif, la seule barrière de sécurité est le RLS. Une policy fausse ne se voit
pas dans l'interface.

**Décision.** Chaque table et chaque rôle (patient, patient tiers, médecin affecté, médecin non affecté,
infirmier affecté, infirmier non affecté, visiteur) est testé avec pgTAP dans `supabase/tests/database/`.
En CI : `supabase test db`. En local sans Docker : `scripts/test-db-local.sh` (PostgreSQL 16 + faux schéma `auth`).
Toute nouvelle table arrive avec ses policies **et** ses tests, dans une nouvelle migration.

**Conséquences.** Les tests décrivent la matrice RBAC de CLAUDE.md ; la casser fait échouer la CI.
Le faux schéma `auth` local reproduit `auth.users` et `auth.uid()` ; la CI utilise le vrai Supabase.
