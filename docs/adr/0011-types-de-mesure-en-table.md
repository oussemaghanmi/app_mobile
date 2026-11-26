# ADR-0011 — Les types de mesure sont une table, pas une contrainte

Statut : Accepté · Date : 2026-11-26

## Contexte
La migration `0015` limitait `health_measurements.kind` à trois valeurs (fréquence cardiaque, tension,
glycémie) et imposait l'unité de chaque type par des contraintes `check`. Le besoin est plus large : relier
**n'importe quel appareil de mesure** (oxymètre, thermomètre, balance, appareil inconnu) par Bluetooth,
caméra, QR, fichier ou saisie manuelle (#109, #134). Chaque nouveau type aurait exigé une migration.

## Décision
- Une table `measurement_types` : types **standard** fournis par migration (`patient_id` nul) et types
  **personnalisés** d'un patient (`code` généré `custom_…`, nom et unités choisis par lui).
- `health_measurements.kind` devient une clé étrangère vers cette table ; l'unité permise et le nombre de
  valeurs (une ou deux) sont vérifiés par un déclencheur, qui contrôle aussi que le type et l'appareil
  appartiennent bien au patient.
- Une table `health_devices` (nom, moyen de connexion) sans aucun identifiant matériel : les identifiants
  Bluetooth sont propres au téléphone et n'y sont jamais envoyés.
- La clé étrangère est en `NO ACTION` (contrôle en fin d'instruction), non en `RESTRICT` : à la suppression
  d'un compte, types personnalisés et mesures partent dans la même instruction.
- Aucun seuil « normal » ou « anormal » (règle 7), aucun code LOINC inventé (colonne facultative).

## Conséquences
- Ajouter un type standard = une ligne dans une migration ; un type personnalisé ne demande aucune migration.
- Un type utilisé par une mesure ne se supprime pas ; un type n'est jamais modifié.
- Le déclencheur de validation est `security definer` et n'est exécutable par personne (sauf le système).
- Toute nouvelle table reste couverte par `export_my_data()` (17 clés) et le test de suppression de compte.
