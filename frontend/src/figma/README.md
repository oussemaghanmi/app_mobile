# Import du prototype Figma Make

1. Dans Figma Make : menu du projet → **Export / Download code** (ou synchronisation GitHub).
2. Copier ici le contenu de `src/` exporté (composants, `App.tsx`, assets) dans `src/figma/`.
3. Migrer écran par écran :
   - garder le JSX et les classes Tailwind (le thème sauge/terracotta est déjà dans `src/styles/index.css`) ;
   - remplacer les données en dur par des appels `supabase` ;
   - remplacer les textes par `t('...')` (fichiers `src/i18n/locales/*.json`) ;
   - brancher le composant à la route correspondante dans `src/App.tsx` (remplace `<Placeholder />`).
4. La carte OpenStreetMap en `<iframe>` fonctionne telle quelle dans Capacitor.

Les écrans du prototype à migrer : Ma maladie, Médicaments, Alimentation (recettes + carte),
Conseils (carte tabac prioritaire), Communauté, Journal privé, Assistant CrohnBot.
