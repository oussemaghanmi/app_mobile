## Description
<!-- Quoi et pourquoi. Lien vers l'issue / l'écran Figma concerné. -->

## Captures d'écran
| Français (LTR) | العربية (RTL) |
|---|---|
| <!-- capture fr --> | <!-- capture ar --> |

## Checklist
- [ ] `npm run lint && npm run typecheck && npm run check:i18n && npm test && npm run build` OK
- [ ] Textes traduits dans les **4** langues (fr, en, ar, tn), pas de copie du français
- [ ] RTL vérifié (propriétés logiques `ms-/me-/ps-/pe-/start-/end-`)
- [ ] Nouvelle table → RLS activé + policies dans une **nouvelle** migration + tests pgTAP (`supabase test db`)
- [ ] `private_journal` jamais exposé (soignants, vues, fonctions, LLM)
- [ ] Accessibilité : cibles ≥ 44 px, `aria-label` sur les boutons icônes
- [ ] Contenu médical général, marqué `TODO(validation-médicale)` si besoin
- [ ] Aucun secret commité
