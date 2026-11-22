# Changelog

Format inspiré de [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/) ; versions `v0.x.0` taguées sur `main`.

## [0.1.0] — à publier

Première version utilisable (procédure de publication : `docs/MISE-EN-PRODUCTION.md`).

### Patient
- Écrans **Ma maladie** (cycle féminin, arrêt du tabac), **Conseils** (carte tabac prioritaire),
  **Alimentation** (recettes, repères, carte des magasins), **Communauté**, **Journal privé**, **Calendrier**.
- **Médicaments** : génération des prises, suivi de l'observance, **rappels** par notifications locales Android.
- **CrohnBot** : assistant d'information générale (Edge Function, quota de 30 messages par jour,
  le journal privé n'est jamais envoyé au modèle).
- Quatre langues : français, anglais, arabe et darija tunisienne (arabe et darija de droite à gauche).

### Soignants
- **Fiche patient** pour le médecin et l'infirmier, limitée aux patients affectés.
- **Prescriptions** créées et modifiées par le médecin ; **observations infirmières**.
- Administration des rôles et des affectations (`docs/ADMIN.md`).

### Sécurité et qualité
- Contrôle d'accès dans la base : RLS sur toutes les tables, aucun droit pour `anon`, tests pgTAP.
- CI : lint, typecheck, i18n, tests unitaires, build, tests de la base, tests de CrohnBot,
  scan des secrets, parcours de bout en bout Playwright ; APK debug à chaque push.

### Limites connues
- Textes médicaux en attente de validation par l'équipe soignante (#44).
- Interface pas encore alignée sur le prototype Figma Make (#43) ; recettes illustrées par un emoji.
- Magasins de démonstration seulement (liste réelle à fournir).
- Rappels pas encore testés sur un vrai téléphone (#45).
