# ADR-0002 — Supabase et sécurité par Row Level Security

**Statut :** Accepté

## Contexte
Il faut une authentification, une base relationnelle et un **contrôle d'accès strict par rôle**
(patient / médecin / infirmier, avec des affectations soignant ↔ patient) sur des données de santé.
L'équipe ne peut pas maintenir un backend applicatif complet.

## Décision
Utiliser **Supabase** (Auth + PostgreSQL + PostgREST + Edge Functions) et appliquer **toute** la
sécurité dans PostgreSQL :
- RLS activé sur chaque table, policies dans des migrations versionnées (jamais modifiées après commit) ;
- rôle applicatif stocké dans `profiles.role`, non modifiable par l'utilisateur (GRANT par colonne) ;
- affectations dans `care_assignments`, helpers `my_role()` / `is_assigned_to()` en `security definer` ;
- policies **testées** par pgTAP en CI.

## Conséquences
- ✅ Même avec un client modifié ou un appel REST direct, un utilisateur ne lit que ce que le RLS autorise.
- ✅ Pas de serveur applicatif à héberger ni à sécuriser, en dehors de l'Edge Function CrohnBot.
- ✅ Les types TypeScript sont générés depuis le schéma (`supabase gen types`).
- ⚠️ La logique d'autorisation est écrite en SQL : chaque nouvelle table exige policies et tests pgTAP.
  C'est une règle de la checklist de PR.
- ⚠️ Dépendance à un fournisseur. PostgreSQL reste standard et migrable.
- ⚠️ Données de santé : choisir une région d'hébergement et vérifier la conformité avec l'INPDP tunisienne.
  À trancher par l'équipe (voir `docs/QUESTIONS.md`).
