# Mise en production : feuille de route de la propriétaire

Les tâches du lot 5 marquées `humain` demandent des comptes, des secrets ou des validations
qu'un agent ne peut pas faire. Ce document les remet **dans l'ordre**, avec ce qui est prêt dans le dépôt
et ce qu'il reste à faire à la main. Aucun secret ne doit être collé dans un chat, une issue ou un commit.

| Ordre | Issue | Sujet | Dépend de | Guide détaillé |
|---|---|---|---|---|
| 1 | #47 | Tableau GitHub Projects | rien (PR #46 déjà fusionnée) | `docs/BOARD.md` |
| 2 | #42 | Projet Supabase, secrets, clé CrohnBot, protection des branches | rien | `docs/PIPELINE.md`, `docs/ADMIN.md` |
| 3 | ~~#43~~ | ~~Export Figma Make~~ : abandonné (ADR-0008) | — | — |
| 4 | #44 | Validation médicale des textes | rien (en parallèle) | ci-dessous |
| 5 | #45 | Essai sur téléphone, magasins, release `v0.1.0` | #42 (et de préférence #44) | ci-dessous |

## 1. Tableau de suivi (#47)

Suivre `docs/BOARD.md` de l'étape 1 à 7. Vérification finale : assigner une issue → la carte passe en
*In progress* ; ouvrir une PR contenant `Closes #n` → *In review*.

## 2. Mise en ligne Supabase (#42)

1. Créer le projet sur supabase.com. Région et conformité INPDP : question n°3 de `docs/QUESTIONS.md`.
2. Secrets GitHub : tableau « Secrets GitHub à créer » de `docs/PIPELINE.md`.
3. Clé CrohnBot, **dans votre terminal** :
   ```bash
   npx supabase secrets set ANTHROPIC_API_KEY=<votre clé> --project-ref <ref>
   ```
   Tant que la clé manque, CrohnBot affiche « pas encore disponible » et ne consomme aucun message du quota (PR #53).
4. Déploiement : automatique par `deploy-supabase.yml` au premier push sur `main` (étape 5), ou à la main :
   ```bash
   npx supabase db push --project-ref <ref>
   ```
   ```bash
   npx supabase functions deploy crohnbot --project-ref <ref>
   ```
5. Protection de `main` et `develop` : section « Protection des branches » de `docs/PIPELINE.md`.
   **Quatre** checks obligatoires : `quality`, `database`, `edge-functions`, `secrets-scan`. Le check
   `edge-functions` a été ajouté par la PR #50, après la rédaction de l'issue.
6. Premiers comptes et affectations : `docs/ADMIN.md`.

## 3. Prototype Figma Make (#43) — abandonné

Décision du 2026-11-22 (ADR-0008) : l'export n'est pas importé, le design est défini dans le code
(`docs/DESIGN.md`). Rien à faire de votre côté.

## 4. Validation médicale (#44)

1. Désigner la personne qui valide (question n°4 de `docs/QUESTIONS.md`).
2. Générer le document de relecture, qui contient tous les textes en 4 langues avec une case « Validé » :
   ```bash
   npm run export:validation -- validation-medicale.md
   ```
   Le fichier peut être imprimé ou converti en PDF pour une relectrice qui ne lit pas le code. Il n'est pas
   versionné : on le régénère à chaque relecture.
3. Relire aussi directement les fichiers listés en fin d'export : conseils de vie (`0005_conseils.sql`),
   recettes (`0004_alimentation.sql`) et consignes de CrohnBot (`supabase/functions/crohnbot/prompt.ts`).
4. Corrections : en commentaire de l'issue #44, en citant la clé (`disease.living.…`) ou la recette.
   Une correction d'un texte en base passe par une **nouvelle** migration (règle 1 de `CLAUDE.md`).
5. Une fois une zone validée, retirer son marqueur. Liste des marqueurs :
   ```bash
   grep -rn "TODO(validation-médicale)" src supabase
   ```
   | Zone | Marqueur |
   |---|---|
   | Signes d'alerte et numéro 190 | `src/components/ui/MedicalNotice.tsx` |
   | Ma maladie (dont cycle féminin, tabac) | `src/features/maladie/components/DiseaseScreen.tsx`, `src/features/maladie/content.ts` |
   | Conseils, arrêt du tabac | `src/features/conseils/components/TipsScreen.tsx`, `supabase/migrations/0005_conseils.sql` |
   | Repères alimentaires et recettes | `src/features/alimentation/components/NutritionScreen.tsx`, `supabase/migrations/0004_alimentation.sql` |
   | Prompt de CrohnBot | `supabase/functions/crohnbot/prompt.ts` |

   Les marqueurs des migrations déjà fusionnées restent en place (on ne modifie jamais une migration
   commitée) : noter leur validation dans l'issue #44.

## 5. Première version `v0.1.0` (#45)

### Essai sur un vrai téléphone Android
Installer l'APK : section « Installer l'APK » de `docs/PIPELINE.md`. Puis cocher :

- [ ] Connexion avec un compte patient créé à l'étape 2.6.
- [ ] Changement de langue fr → ar → tn : l'interface passe bien de droite à gauche.
- [ ] **Rappels médicamenteux** (jamais testés hors navigateur) :
  - [ ] au premier rappel, Android demande l'autorisation des notifications (Android 13 et plus) ;
  - [ ] une prise programmée 2 à 3 minutes plus tard déclenche bien la notification, écran verrouillé ;
  - [ ] la notification arrive encore après fermeture de l'application, puis après redémarrage du téléphone ;
  - [ ] le mode économie de batterie ne la supprime pas (sinon, noter la marque et le modèle du téléphone).
- [ ] Carte des magasins : la carte OpenStreetMap s'affiche.
- [ ] Bouton d'appel d'urgence : il ouvre bien le composeur avec le 190.
- [ ] **CrohnBot** avec la vraie clé : une question simple dans chaque langue ; le compteur des 30 messages
  du jour diminue ; au 31ᵉ message, le message de limite s'affiche.

Noter chaque problème dans une nouvelle issue (modèle « Bug »), avec le modèle du téléphone et la version d'Android.

### Magasins tunisiens
Fournir la liste réelle (nom, ville, adresse, coordonnées GPS), question n°5 de `docs/QUESTIONS.md`.
Elle sera insérée par une nouvelle migration (les magasins actuels de `seed.sql` sont des exemples).

### Release
1. PR `develop → main` intitulée « Release v0.1.0 », reprenant `CHANGELOG.md`. Attendre la CI verte, fusionner.
   Pas de push direct sur `main`.
2. Créer le tag et la release :
   ```bash
   git checkout main && git pull && git tag -a v0.1.0 -m "CronCare v0.1.0" && git push origin v0.1.0
   ```
3. Vérifier que `deploy-supabase.yml` est vert sur `main` et que l'APK est joint à la release.
