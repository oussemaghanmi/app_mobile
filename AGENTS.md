# AGENTS.md — Règles communes à tous les agents de code

Ce fichier s'applique à **tous** les agents qui travaillent sur CronCare (Claude Code, Antigravity, ou tout autre)
et aux personnes qui les pilotent. Les règles de fond du projet sont dans [`CLAUDE.md`](CLAUDE.md)
(§ « Règles NON négociables ») : **les lire avant toute modification**. L'architecture est dans
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md), les décisions dans [`docs/adr/`](docs/adr/).

## Avant de changer quoi que ce soit
1. Lire `CLAUDE.md`, `docs/ARCHITECTURE.md` et la tâche (issue GitHub) à réaliser en entier.
2. Partir de `develop` à jour : `git checkout develop && git pull`.
3. Ne jamais demander ni écrire un secret (clé API, mot de passe, `service_role`) dans le chat, un fichier ou un commit.

## Cycle d'une tâche
1. **Choisir** une issue au label `prêt` et au label de votre agent (`agent:claude` ou `agent:antigravity`).
   Une issue `bloqué` ou `humain` n'est pas pour un agent. Une issue = un agent à la fois.
2. **Annoncer** : vous **assigner** l'issue (la carte passe en « In progress ») et retirer le label `prêt`.
3. **Brancher** : `feature/<numéro>-<sujet>` depuis `develop` (ex. `feature/42-dialogue-confirmation`).
4. **Travailler petit** : commits en Conventional Commits **en français** (`feat(journal): …`, `fix: …`, `test: …`).
5. **Vérifier** avant chaque commit (voir « Définition de fini »).
6. **Ouvrir une PR** vers `develop` avec le modèle de PR, en écrivant `Closes #<numéro>`. Attendre la CI verte.
7. **Ne pas fusionner** soi-même : la fusion est faite par la personne qui pilote la session ou la propriétaire du dépôt.
8. **Terminer** : la fusion de la PR ferme l'issue (`Closes #n`) et la carte passe en « Done ».

## Types d'issues
| Type | Label | Qui la crée | Rôle |
|---|---|---|---|
| Plan | `plan` | la personne qui pilote | regroupe les tâches d'un lot (sous-issues) et liste les interfaces entre elles |
| Tâche | `type:tâche` | la personne qui pilote | une unité de travail avec périmètre et critères de fin vérifiables |
| Décision | `décision` | n'importe qui | un choix qui bloque une tâche ; nomme la tâche sous « Tâche bloquée » |
| Bug | `bug` | n'importe qui | un défaut dans du code déjà fusionné, avec étapes de reproduction |

Rien d'autre : une idée ou une corvée se note dans l'issue du plan. Un agent **ne crée pas** de plan ni de tâche et ne
ferme pas d'issue de décision.

## Tableau de suivi
GitHub Projects, colonnes **Todo → In progress → In review → Done**, plus **Blocked** (voir [`docs/BOARD.md`](docs/BOARD.md)).
Chaque agent et chaque personne tient **ses** cartes à jour ; l'automatisation (`.github/workflows/board.yml`) n'est
qu'un filet : nouvelle issue → Todo, issue assignée → In progress, label `bloqué` → Blocked, PR ouverte avec
`Closes #n` → In review, fusion ou fermeture → Done. Pour déplacer une carte à la main :
`PROJECT_NUMBER=<n> scripts/board-status.sh <numéro> "In review"`, ou lancer le workflow `board` à la main depuis l'onglet Actions.

## Identité et attribution
- Les commits sont au nom de **la personne qui lance la session** (`git config user.name` / `user.email`).
- Aucune ligne `Co-Authored-By`, aucune mention d'agent dans les messages de commit ni dans les descriptions de PR.
- Jamais de `push --force` sur `main` ou `develop`.

## Zones de travail (pour éviter les conflits)
| Zone | Agent par défaut |
|---|---|
| `src/components/`, `src/features/*/components/`, `src/i18n/`, `src/styles/` (interface) | `agent:antigravity` |
| `supabase/` (migrations, tests, fonctions), `.github/`, `scripts/`, `e2e/`, `docs/` | `agent:claude` |
| Projet Supabase, secrets, protection de branches, contenu médical, Figma, essais sur téléphone | `humain` |

Une tâche ne modifie pas de fichiers hors de sa zone sans le dire dans la PR. Les fichiers partagés
(`package.json`, `src/App.tsx`, fichiers de langue) : faire des changements courts et rebaser souvent.
**Migrations** : le numéro est le plus grand existant + 1 ; revérifier juste avant d'ouvrir la PR et renuméroter
en cas de collision. Ne jamais modifier une migration déjà fusionnée.

## Définition de fini
```bash
npm run lint && npm run typecheck && npm run check:i18n && npm test && npm run build
npm run db:test            # si le schéma ou une fonction SQL change (Docker) ; sinon ./scripts/test-db-local.sh
```
- [ ] Les 4 langues sont renseignées pour tout nouveau texte (vraie traduction, pas de copie du français).
- [ ] Classes Tailwind logiques (RTL) ; cibles tactiles ≥ 44 px ; `aria-label` sur les boutons icônes.
- [ ] Toute nouvelle table : RLS + policies + tests pgTAP, dans une **nouvelle** migration ; `private_journal` jamais exposé.
- [ ] Contenu médical : général, jamais de posologie inventée, marqué `// TODO(validation-médicale)`.
- [ ] Tests ajoutés ou mis à jour ; la CI est verte ; la PR dit ce qui n'a **pas** été fait.

## Quand on est bloqué
Ne pas inventer. Commenter l'issue avec la question précise, ajouter le label `bloqué`, et passer à une autre tâche.
Les questions de fond vont dans `docs/QUESTIONS.md`.
