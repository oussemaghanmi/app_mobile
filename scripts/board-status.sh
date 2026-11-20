#!/usr/bin/env bash
# Change le Status d'une issue ou d'une PR sur le tableau GitHub Projects.
# Usage : scripts/board-status.sh <numéro> "<Todo|In progress|Blocked|In review|Done>"
# Variables : PROJECT_NUMBER (obligatoire), PROJECT_OWNER (défaut : propriétaire du dépôt),
#             GITHUB_REPOSITORY (défaut : dépôt du répertoire courant), GH_TOKEN avec le scope `project`.
# Passe par GraphQL : `gh project` exige le scope read:org, que la plupart des jetons n'ont pas.
set -euo pipefail

REPO_FULL=${GITHUB_REPOSITORY:-$(gh repo view --json nameWithOwner --jq .nameWithOwner)}
OWNER=${PROJECT_OWNER:-${REPO_FULL%%/*}}
PROJECT_NUMBER=${PROJECT_NUMBER:?définir PROJECT_NUMBER (numéro du tableau, visible dans son URL)}

if [ $# -ne 2 ]; then
  echo "usage: $0 <numéro-issue-ou-PR> \"<statut>\"" >&2
  exit 2
fi
number=$1
status=$2

# Le propriétaire est un compte personnel (user) ou une organisation : on essaie les deux.
query='query($owner: String!, $n: Int!) {
  %s(login: $owner) { projectV2(number: $n) { id field(name: "Status") {
    ... on ProjectV2SingleSelectField { id options { id name } } } } } }'
project=""
for kind in user organization; do
  project=$(gh api graphql -f query="$(printf "$query" "$kind")" -f owner="$OWNER" -F n="$PROJECT_NUMBER" \
    --jq ".data.$kind.projectV2" 2>/dev/null || true)
  [ -n "$project" ] && [ "$project" != "null" ] && break
done
if [ -z "$project" ] || [ "$project" = "null" ]; then
  echo "tableau n°$PROJECT_NUMBER introuvable pour $OWNER (jeton sans scope project ?)" >&2
  exit 1
fi

project_id=$(jq -r '.id' <<<"$project")
field_id=$(jq -r '.field.id' <<<"$project")
# Comparaison insensible à la casse : « In progress » / « In Progress » (valeur par défaut de GitHub).
option_id=$(jq -r --arg s "$status" '.field.options[] | select((.name | ascii_downcase) == ($s | ascii_downcase)) | .id' <<<"$project")
if [ -z "$option_id" ]; then
  echo "statut inconnu « $status » ; valides : $(jq -r '[.field.options[].name] | join(", ")' <<<"$project")" >&2
  exit 2
fi

content_id=$(gh api "repos/$REPO_FULL/issues/$number" --jq '.node_id')
find_item() {
  gh api graphql -f query='
    query($c: ID!) {
      node(id: $c) {
        ... on Issue { projectItems(first: 20) { nodes { id project { id } } } }
        ... on PullRequest { projectItems(first: 20) { nodes { id project { id } } } }
      }
    }' -f c="$content_id" --jq ".data.node.projectItems.nodes[] | select(.project.id == \"$project_id\") | .id"
}
item_id=$(find_item)
if [ -z "$item_id" ]; then
  item_id=$(gh api graphql -f query='
    mutation($p: ID!, $c: ID!) {
      addProjectV2ItemById(input: {projectId: $p, contentId: $c}) { item { id } }
    }' -f p="$project_id" -f c="$content_id" --jq '.data.addProjectV2ItemById.item.id' 2>/dev/null) \
    || item_id=$(find_item)
fi
if [ -z "$item_id" ]; then
  echo "#$number introuvable sur le tableau et impossible à y ajouter" >&2
  exit 1
fi

gh api graphql -f query='
  mutation($p: ID!, $i: ID!, $f: ID!, $o: String!) {
    updateProjectV2ItemFieldValue(
      input: {projectId: $p, itemId: $i, fieldId: $f, value: {singleSelectOptionId: $o}}
    ) { projectV2Item { id } }
  }' -f p="$project_id" -f i="$item_id" -f f="$field_id" -f o="$option_id" >/dev/null

echo "#$number -> $status"
