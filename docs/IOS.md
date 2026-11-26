# Application iOS

Depuis l'ADR-0010, CronCare cible **Android et iOS** avec le même code web et Capacitor 7. Le projet natif `ios/`
est versionné (comme `android/`).

## Prérequis
- Un Mac avec **Xcode 16 ou plus récent** (exigé par Capacitor 7) et **CocoaPods** (`sudo gem install cocoapods`
  ou `brew install cocoapods`).
- Node 22 et les dépendances du projet (`npm ci`).
- Pour un iPhone réel, TestFlight ou l'App Store : un **compte Apple Developer** et un certificat de signature
  (tâche humaine, pas encore faite). Sans eux, seul le simulateur fonctionne.

## Commandes
```bash
npm run cap:ios          # build web + cap sync (pod install) + ouvre Xcode
npx cap sync ios         # après un changement de code web ou de plugin
npm run assets:generate  # icônes et écrans de démarrage Android et iOS depuis assets/logo.png
```
Dans Xcode : schéma **App**, choisir un simulateur iPhone, puis ▶.

Compilation sans Xcode ouvert (comme la CI) :
```bash
xcodebuild -workspace ios/App/App.xcworkspace -scheme App -configuration Debug \
  -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' \
  -derivedDataPath build/ios CODE_SIGNING_ALLOWED=NO build
scripts/ios-captures.sh build/ios/Build/Products/Debug-iphonesimulator/App.app captures-ios
```

## CI
`.github/workflows/ios.yml` compile pour le simulateur, sans signature, sur `macos-latest`, puis lance l'application
en français et en arabe et publie les captures (artefact **`captures-ios`** de l'exécution).

## Règles propres à iOS
- **Descriptions d'usage** (`ios/App/App/Info.plist`) : chaque accès protégé (position, caméra, santé, Bluetooth,
  mouvement…) exige une phrase expliquant l'usage, sinon l'application plante ou est refusée. On l'ajoute **dans la
  tâche qui crée la fonction**, jamais avant (Apple refuse une description de fonction absente), en 4 langues.
- **Langues** : `CFBundleLocalizations` déclare fr, en, ar. Sans cette clé, la WebView annonce « en » quelle que
  soit la langue de l'iPhone et la détection de langue à la première ouverture (#112) ne fonctionne pas. Le darija
  n'est pas une langue iOS : il suit l'arabe pour le système, et se choisit dans l'application.
- **Lien « Mot de passe oublié »** : schéma `tn.croncare.app` déclaré dans `CFBundleURLTypes` (ADR-0009) ;
  `AppDelegate.swift` transmet déjà les liens à Capacitor.
- Rappels médicamenteux : `@capacitor/local-notifications` demande l'autorisation au premier rappel, comme sur
  Android 13+ ; **pas encore essayé sur un iPhone**.
