# ADR-0003 — Séparer le journal des symptômes et le journal privé

**Statut :** Accepté

## Contexte
Le patient note à la fois des **données cliniques** (douleur, nombre de selles), utiles à l'équipe
soignante, et des **pensées personnelles**, qu'il ne veut partager avec personne. Une table unique avec un
drapeau « privé » ferait reposer la confidentialité sur un filtre qu'une policy, une vue ou un bug
pourraient oublier.

## Décision
Deux tables distinctes :
- `symptom_logs` : lisible par le patient **et** les soignants affectés. L'interface l'indique
  explicitement à l'utilisateur.
- `private_journal` : **une seule policy**, `patient_id = auth.uid()`, pour toutes les opérations.
  Aucune vue, fonction, export soignant ou Edge Function ne la lit. Elle n'est jamais envoyée au LLM.

## Conséquences
- ✅ La confidentialité est structurelle, vérifiable d'un coup d'œil et testée par pgTAP
  (médecin, infirmier, autre patient, anonyme).
- ✅ L'interface montre deux espaces visuellement distincts (icône cadenas pour le privé).
- ⚠️ Pas de « partage ponctuel » d'une entrée privée avec le médecin. Si besoin, le patient la recopie
  dans le journal des symptômes : c'est un acte volontaire.
