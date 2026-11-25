# ADR-0010 — L'application cible Android et iOS

Statut : Accepté · Date : 2026-11-25 · Remplace, pour la cible, l'ADR-0001 (« iOS possible plus tard »)

## Contexte
L'ADR-0001 a choisi Capacitor avec Android comme cible principale ; `ios/` n'existait pas et aucune CI ne
compilait pour iOS. L'équipe veut publier aussi sur iPhone (#145, plan #105). Les fonctions à venir (zones de
sécurité, mesures de santé, Bluetooth) ont des équivalents iOS (HealthKit, Core Bluetooth, géolocalisation),
chacun soumis à une description d'usage obligatoire dans `Info.plist`.

## Décision
- **Deux plateformes, Android et iOS**, avec le même code web (React) et Capacitor 7.
- `ios/` est **versionné** comme `android/` (ADR-0006) ; il est créé par `npx cap add ios` (CocoaPods). Les fichiers
  générés (`Pods/`, `public/`, `capacitor.config.json`) restent ignorés par Git.
- CI `.github/workflows/ios.yml` : compilation pour le **simulateur, sans signature**, sur `macos-latest` (gratuit
  pour un dépôt public), plus des captures de l'application en français et en arabe (artefact `captures-ios`).
- `Info.plist` ne déclare que ce qui existe : langues gérées (`CFBundleLocalizations` : fr, en, ar ; sans elles la
  WebView annonce « en »), lien `tn.croncare.app://` (ADR-0009). **Aucune description d'usage** tant que la
  fonction correspondante n'existe pas (Apple refuse une description de fonction absente).
- Icônes et écran de démarrage iOS générés par `npm run assets:generate` (`@capacitor/assets`, `--android --ios`).

## Conséquences
- Une tâche qui touche du code natif ou un plugin Capacitor vérifie **les deux plateformes** (`AGENTS.md`) ; chaque
  nouvel accès protégé ajoute sa description d'usage dans `Info.plist` en 4 langues, dans la même tâche.
- Signature, TestFlight et App Store attendent un compte Apple Developer (tâche humaine) ; d'ici là, rien n'est
  essayé sur un iPhone réel.
- L'ADR-0001 n'est pas réécrit : son choix de Capacitor reste valable, seule sa cible est remplacée ici.
