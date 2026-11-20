## Ce qui change

## Pourquoi

## Comment c'est testé
<!-- Commandes lancées et résultats : `npm run check` dans frontend/, `scripts/test-db-local.sh`, test manuel… -->

## Contrôles (règles CLAUDE.md)
- [ ] `cd frontend && npm run check` passe (lint, format, i18n, RTL, typecheck, tests, build)
- [ ] Toute nouvelle table : RLS activé + policies + tests pgTAP, dans une **nouvelle** migration
- [ ] `private_journal` n'est exposé à aucun soignant, vue, fonction ni LLM
- [ ] Aucun secret ajouté ; aucun texte en dur ; clés ajoutées dans les 4 langues
- [ ] Classes Tailwind logiques (RTL) ; cibles tactiles ≥ 44 px ; `aria-label` sur les boutons icônes
- [ ] Contenu médical : général, marqué `// TODO(validation-médicale)`

## Non fait, ou fait autrement que prévu
<!-- Écrire « Rien » s'il n'y a rien. -->

## Dette connue ajoutée
<!-- Chaque raccourci pris volontairement : où, pourquoi, ce qu'il faut pour le corriger. « Aucune » sinon. -->

Closes #
