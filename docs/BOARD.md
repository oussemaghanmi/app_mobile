# Tableau de suivi (GitHub Projects)

Le tableau donne l'état de chaque tâche d'un coup d'œil, comme dans le projet de référence.
Colonnes (champ **Status**) : **Todo**, **In progress**, **Blocked**, **In review**, **Done**.

## Mise en place (une seule fois, par la propriétaire du dépôt)
Elle demande des droits de propriétaire : un agent ne peut ni créer le tableau ni lire ses jetons.

1. **Créer le tableau** : GitHub → votre profil → *Projects* → *New project* → modèle **Board**, nom « CronCare ».
   Dans les réglages du champ **Status**, avoir exactement ces cinq options, dans cet ordre :
   `Todo`, `In progress`, `Blocked`, `In review`, `Done`.
2. **Lier le dépôt** : dans le tableau, *⋯ → Settings → Manage access / Linked repositories* → `app_mobile`.
3. **Workflows intégrés** (⋯ → *Workflows*) : activer *Item closed → Done* et *Pull request merged → Done*.
   Ne pas activer *Auto-add* : `board.yml` ajoute les cartes lui-même.
4. **Jeton** : *Settings → Developer settings → Personal access tokens (classic)* → *Generate*, scopes `repo` et
   **`project`**. L'enregistrer dans le dépôt : *Settings → Secrets and variables → Actions → Secrets* →
   `PROJECT_TOKEN`. Ne jamais le coller dans un chat, un fichier ou un commit.
5. **Numéro du tableau** : c'est le nombre de son URL (`github.com/users/<vous>/projects/<N>`). L'enregistrer dans
   *Actions → Variables* sous le nom `PROJECT_NUMBER`.
6. **Remplir le tableau avec les issues existantes** (depuis votre terminal, jeton `gh` avec les scopes `repo` et `project`) :
   ```bash
   PROJECT_NUMBER=<N> scripts/board-sync.sh
   ```
7. **Vues utiles** : *Board* groupé par Status, et une vue *Table* avec les colonnes Assignees, Labels et Milestone.

Tant que `PROJECT_TOKEN` ou `PROJECT_NUMBER` manque, le workflow `board` reste vert et n'affiche qu'une note : il ne casse rien.

## Comment les cartes bougent
| Événement | Carte |
|---|---|
| nouvelle issue | Todo (Blocked si elle porte le label `bloqué`) |
| tâche assignée | In progress |
| dernière personne désassignée | Todo |
| label `bloqué` ajouté / retiré | Blocked / In progress ou Todo |
| issue « décision » ouverte | la tâche citée sous « Tâche bloquée » passe en Blocked ; revient en In progress à la fermeture |
| PR vers `develop` ouverte avec `Closes #n` | l'issue n passe en In review |
| changements demandés sur une PR | la PR et ses issues repassent en In progress, puis In review au push suivant |
| PR fusionnée ou issue fermée | Done (workflows intégrés du tableau) |

Mouvement manuel : `PROJECT_NUMBER=<N> scripts/board-status.sh <numéro> "In review"` ou le workflow `board`
lancé à la main (onglet Actions, champs `number` et `status`).
