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
- **Comptes** : inscription, mot de passe oublié et réinitialisation, avec messages d'erreur traduits.
- **Données personnelles** : export complet en un fichier JSON (14 tables, erreur visible si l'export échoue),
  suppression du journal et du compte avec boîte de confirmation accessible ; jours calendaires à l'heure de Tunis.
- **Accessibilité et design** : contrastes WCAG AA, icônes, logo et icône Android, cibles tactiles de 44 px,
  audit automatisé axe des écrans principaux.

### Soignants
- **Fiche patient** pour le médecin et l'infirmier, limitée aux patients affectés.
- **Prescriptions** créées et modifiées par le médecin ; **observations infirmières**.
- Administration des rôles et des affectations, et modération de la communauté (contenus signalés :
  lister, remettre en ligne, supprimer), par fonctions réservées à `service_role` (`docs/ADMIN.md`).

### Sécurité et qualité
- Contrôle d'accès dans la base : RLS sur toutes les tables, aucun droit pour `anon`, tests pgTAP
  (dont l'export et la suppression de compte patient).
- CI : lint, typecheck, i18n, tests unitaires, build, tests de la base, tests de CrohnBot,
  scan des secrets, parcours de bout en bout Playwright ; APK debug à chaque push.

### Limites connues
- Textes médicaux en attente de validation par l'équipe soignante (#44).
- Recettes illustrées par un emoji (aucune image libre de droits fournie).
- Magasins de démonstration seulement (liste réelle à fournir).
- Rappels pas encore testés sur un vrai téléphone (#45).
- La réinitialisation du mot de passe ne se termine pas depuis l'application Android : le lien de l'e-mail s'ouvre
  dans le navigateur (#88).
- Traductions en arabe et en darija non relues par des locuteurs (#64).
- Suppression du compte d'un médecin ou d'une infirmière ayant des prescriptions ou des observations : refusée
  par la base, en attente d'une décision (#66).
- Défauts d'interface connus : nom du médicament coupé dans « Aujourd'hui » (#100), langue active des Paramètres
  (#101), lien Paramètres des soignants trop petit et échelle de douleur en arabe (#102).
