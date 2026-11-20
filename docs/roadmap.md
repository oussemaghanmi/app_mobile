# Feuille de route

Chaque lot = une branche `feature/…` = une PR vers `develop`. Un lot passe tous les contrôles avant fusion.

| Lot | Contenu | État |
|---|---|---|
| 0 | Socle du dépôt : `frontend/`, outillage, contrôles i18n/RTL, pipeline, documentation | fait |
| 1 | Base : migration `0002` (RLS durci, génération des prises), tests pgTAP | fait |
| 2 | Socle front : design system accessible, inscription/connexion complètes, TanStack Query, boîte de dialogue de confirmation, `features/` | à faire |
| 3 | Écrans patient : Médicaments, Journal, Calendrier, Ma maladie, Alimentation, Conseils, Communauté | à faire |
| 4 | Rappels médicamenteux (Capacitor Local Notifications) | à faire |
| 5 | Espace soignant : prescriptions (médecin), observations (infirmier), détail patient | à faire |
| 6 | CrohnBot : Edge Function + écran, limite de débit, jamais de `private_journal` | à faire |

Contraintes de contenu : aucun texte médical inventé ; les écrans éducatifs restent généraux et renvoient au
médecin (`// TODO(validation-médicale)`). Aucune maquette Figma n'est disponible : les écrans suivent les
descriptions du README et le thème sauge / terracotta / crème.
