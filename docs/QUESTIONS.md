# Questions ouvertes

Informations manquantes que Claude Code n'a pas inventées. Répondre directement dans ce fichier ou en
commentaire de PR.

| # | Date | Sujet | Question | Bloque |
|---|---|---|---|---|
| 1 | 2026-10-25 | Design | ~~Export Figma Make nécessaire~~ **Tranché le 2026-11-22** : pas d'export, design défini dans le code (ADR-0008, `docs/DESIGN.md`). | Non |
| 2 | 2026-10-25 | GitHub | Le changement de branche par défaut (`develop`) et la protection des branches n'ont pas pu être faits automatiquement (droits « settings » refusés). À faire dans Settings → General / Branches (commandes dans `docs/PIPELINE.md`). | Non |
| 3 | 2026-10-25 | Hébergement | Région du projet Supabase et conformité INPDP (données de santé) à valider par l'équipe. | Non (production) |
| 4 | 2026-10-25 | Contenu médical | Les textes éducatifs (Ma maladie, Conseils, cycle féminin, tabac) seront rédigés de façon générale et marqués `TODO(validation-médicale)` : qui les valide ? | Non |
| 5 | 2026-11-13 | Alimentation | **Liste réelle des magasins tunisiens** (nom, ville, adresse, coordonnées) à fournir. `seed.sql` ne contient que des magasins de démonstration génériques. | Non (production) |
| 6 | 2026-11-13 | Alimentation | Images des recettes : plus d'export Figma (ADR-0008). Chaque recette garde son emoji ; fournir des images libres de droits si l'équipe en veut. | Non |
| 7 | 2026-11-13 | CrohnBot | Créer une clé API Claude et l'enregistrer : `npx supabase secrets set ANTHROPIC_API_KEY=… --project-ref <ref>`. Sans elle, l'écran affiche « CrohnBot n'est pas encore disponible ». | CrohnBot en production |
| 8 | 2026-11-13 | GitHub | ~~Retirer « Claude » des contributeurs~~ **Fait le 2026-11-20** : auteurs, committers et trailers `Co-Authored-By` réécrits sur toutes les branches (contenu identique, `push --force-with-lease`). Conséquence : GitHub a fermé les anciennes PR #1 à #15, recréées en #16 à #31. Un backup de l'ancien historique n'est pas conservé dans le dépôt. | Non |
| 9 | 2026-11-13 | GitHub | Merges et releases `v0.x.0` à faire par la propriétaire (merge sans revue interdit depuis la session). Les PR #16 → #31 sont empilées : les merger **dans l'ordre**, #16 d'abord (elle demande la validation explicite de la propriétaire). | Livraison sur `main` |
