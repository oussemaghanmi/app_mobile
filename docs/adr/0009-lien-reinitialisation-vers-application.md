# ADR-0009 — Le lien « Mot de passe oublié » rouvre l'application Android

Statut : Accepté · Date : 2026-11-24

## Contexte
Dans l'APK, `resetPasswordForEmail` envoyait `window.location.origin` (`https://localhost`) comme adresse de
retour : Supabase l'ignore (absente de `additional_redirect_urls`), le lien de l'e-mail s'ouvre dans le
navigateur du téléphone et la réinitialisation ne peut pas se terminer (#88). Deux options :
(a) une page web de réinitialisation hébergée à une adresse publique ; (b) un lien qui rouvre l'application.
Le projet n'a aucun hébergement web.

## Décision
Option (b), avec un **schéma propre à l'application** : `tn.croncare.app://reset-password` (l'identifiant de
l'application, `appId` de `capacitor.config.ts`, ce qui évite toute collision avec une autre application).
- `getResetPasswordRedirectUrl()` renvoie ce lien dans l'APK (`Capacitor.isNativePlatform()`), et garde
  `VITE_SITE_URL` ou l'origine de la page sur le web.
- `AndroidManifest.xml` déclare le lien (`intent-filter` VIEW / BROWSABLE, schéma et hôte ci-dessus).
- Le plugin officiel `@capacitor/app` (version 7, comme le reste de Capacitor) reçoit le lien
  (`appUrlOpen`) ; `useRecoveryDeepLink()` ouvre la session de récupération (jetons du fragment en flux
  implicite, ou échange du code en flux PKCE) puis affiche l'écran « Nouveau mot de passe ». Un lien expiré
  ou déjà utilisé affiche le message d'erreur existant de cet écran.
- L'adresse est autorisée dans Supabase : `supabase/config.toml` en local, tableau de bord en production.

## Conséquences
- Aucun hébergement à créer. Le lien ne fonctionne que sur un téléphone où l'application est installée.
- Un schéma personnalisé n'est pas vérifié comme un « App Link » `https` : une autre application pourrait
  déclarer le même schéma. Le risque est faible (schéma = identifiant de l'application) ; si un domaine est
  un jour disponible, passer à un App Link vérifié (`assetlinks.json`) par un nouvel ADR.
- Production : ajouter `tn.croncare.app://reset-password` dans **Supabase → Authentication → URL
  Configuration → Redirect URLs** (`docs/MISE-EN-PRODUCTION.md`).
- À vérifier sur un vrai téléphone avec les e-mails de production (#45) : selon le client de messagerie, la
  redirection vers un schéma personnalisé peut demander une confirmation à la personne.
