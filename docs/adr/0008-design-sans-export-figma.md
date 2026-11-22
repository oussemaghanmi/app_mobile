# ADR-0008 — Le design est défini dans le code, sans export Figma Make

Statut : Accepté · Date : 2026-11-22

## Contexte
Le projet prévoyait de reprendre le code exporté du prototype Figma Make (`src/figma/`, « source de vérité
du design »). L'export n'a jamais été fourni, et le propriétaire du dépôt a décidé le 2026-11-22 de ne pas
l'importer : l'interface et le reste du code sont produits directement dans le dépôt. Tous les écrans existent
déjà ; ils suivent le thème décrit pour le prototype (sauge, terracotta, crème, Lora + DM Sans).

## Décision
- `src/figma/` est supprimé ; plus aucune tâche n'attend un export.
- La référence du design devient le **système de design du code** : jetons dans `src/styles/index.css`
  (`@theme`) et composants partagés de `src/components/ui/`. Il est décrit dans `docs/DESIGN.md`.
- Les images des recettes ne viennent plus du prototype : les recettes gardent un emoji tant qu'aucune image
  libre de droits n'est fournie (`recipes.image_url` reste facultatif).

## Conséquences
- L'issue « Fournir l'export du prototype Figma Make » est close (non planifiée) ; « Aligner l'interface sur le
  prototype » devient « Harmoniser l'interface sur le système de design » et n'est plus bloquée.
- Les ADR 0001 et 0005 mentionnent encore la reprise du JSX de Figma : leur décision (Capacitor, organisation
  par fonctionnalité) reste valable, seule la motivation « reprise de l'export » ne s'applique plus.
- Toute évolution visuelle passe par les jetons et les composants partagés, pas par des valeurs en dur dans les
  écrans.
