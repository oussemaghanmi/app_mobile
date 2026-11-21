#!/usr/bin/env bash
# Met le tableau d'équerre avec les issues ouvertes : « Blocked » si le label `bloqué` est présent,
# « In progress » si l'issue est assignée, sinon « Todo ». À lancer une fois après la création du tableau.
# Usage : PROJECT_NUMBER=<n> scripts/board-sync.sh        (jeton gh avec les scopes repo et project)
set -euo pipefail
here=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
gh issue list --state open --limit 200 --json number,labels,assignees |
  jq -r '.[] | [.number,
      (if any(.labels[]; .name == "bloqué") then "Blocked"
       elif (.assignees | length) > 0 then "In progress"
       else "Todo" end)] | @tsv' |
  while IFS=$'\t' read -r n status; do "$here/board-status.sh" "$n" "$status"; done
