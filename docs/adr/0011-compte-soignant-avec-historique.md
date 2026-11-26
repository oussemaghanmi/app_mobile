# ADR-0011 — Un soignant qui a écrit dans des dossiers ne supprime pas son compte (décision provisoire)

Statut : Accepté (provisoire, à revoir après la réponse sur la conformité, #69) · Date : 2026-11-26 · Décision #66

## Contexte
Les prescriptions (`prescriptions.prescribed_by`) et les observations (`nursing_notes.nurse_id`) pointent vers le
profil de leur auteur sans suppression en cascade : la base refuse la suppression du compte d'un soignant qui a écrit
(erreur `23503`). Quatre options ont été étudiées dans #66 : (A) garder les lignes et effacer l'auteur, (B) tout
supprimer en cascade, (C) refuser la suppression tant qu'il reste des écritures, (D) désactiver le compte au lieu de
le supprimer. Le choix entre A et D dépend de la réglementation (effacement réel ou traçabilité de l'auteur d'une
prescription) : la question est posée à un juriste ou à l'INPDP (#69, question 4) et n'a pas encore de réponse.

## Décision
**Option C, à titre provisoire.**
- La base garde son comportement actuel : un compte soignant qui a écrit une prescription ou une observation ne peut
  pas être supprimé ; aucune donnée médicale de patient n'est effacée ni privée de son auteur.
- L'application ne propose déjà « Supprimer le compte » qu'aux patients (`Settings.tsx`, `isPatient`).
- Un soignant qui quitte l'équipe est **retiré par l'administration** : ses affectations sont supprimées puis son rôle
  repasse à `patient` ; il ne voit alors plus aucun dossier (procédure dans `docs/ADMIN.md`).
- L'option B est **écartée définitivement** : elle effacerait des données médicales de patients et, par cascade,
  leurs prises et leur observance.

## Conséquences
- Aucune perte de données, aucune hypothèse juridique ; le choix A ou D reste possible sans rien défaire.
- Un soignant parti ne peut pas effacer lui-même son compte : sa demande passe par l'administration.
- À revoir dès la réponse à la question 4 de #69 : passer à A (effacement réel, auteur affiché « compte supprimé »)
  ou à D (désactivation, traçabilité conservée) par un nouvel ADR et une migration.
- La tâche « Suppression du compte d'un soignant » (#65) n'est plus bloquée par l'absence de décision : sa portée
  devient l'option C (message clair et procédure d'administration testée).
