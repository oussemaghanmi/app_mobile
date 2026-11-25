// Limite de travail en cours : au plus N issues « en cours » par compte (voir AGENTS.md).
// Fonctions pures (testées dans wip-limit.test.mjs) utilisées par .github/workflows/wip-limit.yml.

/** Une issue qui porte l'un de ces labels n'est pas du travail de code en cours. */
const EXEMPT_LABELS = ['humain', 'décision', 'plan', 'bloqué', 'incomplet'];

const DEFAULT_LIMIT = 4;

/** Numéros cités par « Closes #n », « Fixes #n », « Resolves #n » dans le texte d'une PR. */
function linkedIssueNumbers(body) {
  const numbers = new Set();
  const pattern = /\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\s+#(\d+)/gi;
  for (const match of String(body ?? '').matchAll(pattern)) numbers.add(Number(match[1]));
  return numbers;
}

const labelNames = (issue) => (issue.labels ?? []).map((l) => (typeof l === 'string' ? l : l.name));

function isExempt(issue) {
  const names = labelNames(issue);
  return EXEMPT_LABELS.some((label) => names.includes(label));
}

/**
 * Issues « en cours » : ouvertes, assignées, de code (non exemptées), qui ne sont pas des PR et qui
 * ne sont citées par aucune PR ouverte ou fusionnée (dès qu'une PR existe l'issue est « en revue »).
 */
function inProgress({ issues, prs }) {
  const linked = new Set();
  for (const pr of prs) {
    if (pr.state === 'open' || pr.merged_at) for (const n of linkedIssueNumbers(pr.body)) linked.add(n);
  }
  return issues
    .filter((i) => !i.pull_request && i.state === 'open' && !isExempt(i) && !linked.has(i.number))
    .map((i) => i.number)
    .sort((a, b) => a - b);
}

/**
 * Décide si l'assignation de `issue` à un compte est permise.
 * `assignedIssues` : issues ouvertes déjà assignées à ce compte, **y compris** `issue`.
 */
function decide({ issue, assignedIssues, prs, limit = DEFAULT_LIMIT }) {
  if (issue.pull_request || isExempt(issue)) return { allowed: true, current: [] };
  const current = inProgress({ issues: assignedIssues, prs });
  return { allowed: current.length <= limit, current };
}

module.exports = { EXEMPT_LABELS, DEFAULT_LIMIT, linkedIssueNumbers, isExempt, inProgress, decide };
