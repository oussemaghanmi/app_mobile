# ADR-0012 — Projet Supabase créé maintenant, avec des données de démonstration uniquement (décision provisoire)

Statut : Accepté (provisoire, à revoir après l'avis juridique) · Date : 2026-11-26 · Décision #69

## Contexte
Créer le projet Supabase (#42, étape 1) impose de choisir une région, définitive pour ce projet. CronCare traite des
**données de santé** de patients tunisiens. La conformité (déclaration ou autorisation préalable, hébergement hors de
Tunisie, information et consentement, effacement) relève d'un juriste ou de l'INPDP ; personne n'a encore répondu
(`docs/QUESTIONS.md`, question 3). Options étudiées dans #69 : (A) créer maintenant avec des données de démonstration,
(B) attendre l'avis juridique, (C) héberger soi-même en Tunisie.

## Décision
**Option A.**
- Créer le projet dans la **région européenne proposée par Supabase la plus proche de Tunis** au moment de la
  création (choisir dans la liste affichée par Supabase ; la région retenue est notée dans `docs/QUESTIONS.md`,
  question 3).
- **Aucune donnée de vrai patient** dans ce projet tant que les 4 questions de #69 n'ont pas de réponse confirmée :
  comptes de test et données de démonstration seulement, y compris pour les essais sur téléphone (#45) et CrohnBot.
- L'option C (hébergement en Tunisie par l'équipe) est écartée pour l'instant : charge d'exploitation hors de portée.

## Conséquences
- Débloque la mise en ligne technique (#42), les essais sur téléphone et la clé CrohnBot (#45).
- Si l'avis juridique impose une autre région ou un hébergement en Tunisie, il faudra recréer un projet et refaire la
  configuration (secrets, déploiement) : coût accepté, aucune vraie donnée n'étant à migrer.
- Les questions juridiques restent ouvertes et doivent être posées par l'équipe (elles conditionnent aussi la
  révision de l'ADR-0011 sur les comptes de soignants).
