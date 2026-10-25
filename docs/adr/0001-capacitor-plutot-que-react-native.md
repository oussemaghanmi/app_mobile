# ADR-0001 — Capacitor plutôt que React Native

**Statut :** Accepté

## Contexte
Le prototype a été produit dans **Figma Make**, qui exporte du **React web** (JSX + classes Tailwind).
L'objectif est de conserver au maximum ce design et cette navigation. La cible principale est Android,
pour une équipe réduite issue d'un projet de fin d'études.

## Décision
Empaqueter l'application web React/Vite avec **Capacitor 7**, sans la réécrire en React Native.

## Conséquences
- ✅ Le JSX et les classes Tailwind de Figma Make sont réutilisés presque tels quels, sans réécriture
  vers des primitives `<View>/<Text>`.
- ✅ Une seule base de code pour le web (démo, soutenance) et Android, et iOS possible plus tard.
- ✅ Les plugins natifs nécessaires existent : `@capacitor/local-notifications` pour les rappels.
  L'`<iframe>` OpenStreetMap fonctionne dans la WebView.
- ⚠️ Performances d'une WebView : suffisantes pour des formulaires et des listes, moins pour des
  animations lourdes.
- ⚠️ Le RTL et les polices arabes dépendent du moteur WebView Android : à tester sur appareil réel.
