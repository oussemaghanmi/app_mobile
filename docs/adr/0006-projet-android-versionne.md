# ADR-0006 — Le projet natif `android/` est versionné

**Statut :** Accepté

## Contexte
La CI doit produire un APK. Deux options : générer `android/` à chaque build (`npx cap add android`),
ou committer le projet natif une fois.

## Décision
Committer `android/`, généré par `npx cap add android` en Phase 2. Le workflow `android.yml` lance
`npx cap sync android`, et seulement `cap add` si le dossier manque.

## Conséquences
- ✅ La configuration native est relue en PR : permissions (notifications, alarmes exactes), icône de
  notification `ic_stat_icon`, nom et version de l'app. Avec un projet régénéré à chaque build, elle
  serait perdue.
- ✅ Le build est reproductible, et c'est la pratique recommandée par Capacitor.
- ⚠️ Mise à jour de Capacitor : il faut penser à `npx cap migrate` / `cap sync` et committer le diff.
- ⚠️ Les fichiers générés (`android/app/src/main/assets/public`, `build/`) restent ignorés
  (`android/.gitignore`).
