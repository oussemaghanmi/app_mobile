import { describe, expect, it } from 'vitest';
import wip from './wip-limit.cjs';

const { decide, inProgress, isExempt, linkedIssueNumbers } = wip;

const issue = (number, labels = ['type:tâche'], extra = {}) => ({
  number,
  state: 'open',
  labels: labels.map((name) => ({ name })),
  ...extra,
});
const pr = (body, extra = {}) => ({ state: 'open', merged_at: null, body, ...extra });

describe('linkedIssueNumbers', () => {
  it('lit Closes, Fixes et Resolves, sans tenir compte de la casse', () => {
    expect([...linkedIssueNumbers('Closes #12\nfixes #7 et RESOLVED #30')].sort((a, b) => a - b)).toEqual([
      7, 12, 30,
    ]);
  });
  it('ignore une simple mention et les corps vides', () => {
    expect(linkedIssueNumbers('voir #5').size).toBe(0);
    expect(linkedIssueNumbers(null).size).toBe(0);
  });
});

describe('isExempt', () => {
  it.each(['humain', 'décision', 'plan', 'bloqué', 'incomplet'])('le label « %s » exempte', (label) => {
    expect(isExempt(issue(1, [label]))).toBe(true);
  });
  it('une tâche de code n’est pas exemptée', () => {
    expect(isExempt(issue(1, ['type:tâche', 'agent:claude']))).toBe(false);
  });
});

describe('inProgress', () => {
  it('compte les tâches ouvertes sans PR', () => {
    expect(inProgress({ issues: [issue(3), issue(1), issue(2)], prs: [] })).toEqual([1, 2, 3]);
  });
  it('une PR ouverte qui cite l’issue la fait passer « en revue »', () => {
    expect(inProgress({ issues: [issue(1), issue(2)], prs: [pr('Closes #1')] })).toEqual([2]);
  });
  it('une PR fusionnée aussi (l’issue peut rester ouverte jusqu’à sa fermeture manuelle)', () => {
    const merged = pr('Closes #2', { state: 'closed', merged_at: '2026-11-22T10:00:00Z' });
    expect(inProgress({ issues: [issue(2)], prs: [merged] })).toEqual([]);
  });
  it('une PR fermée sans fusion ne compte pas', () => {
    const abandoned = pr('Closes #2', { state: 'closed', merged_at: null });
    expect(inProgress({ issues: [issue(2)], prs: [abandoned] })).toEqual([2]);
  });
  it('ignore les issues fermées, exemptées et les pull requests', () => {
    const issues = [
      issue(1, ['type:tâche'], { state: 'closed' }),
      issue(2, ['humain']),
      issue(3, ['type:tâche'], { pull_request: {} }),
      issue(4),
    ];
    expect(inProgress({ issues, prs: [] })).toEqual([4]);
  });
});

describe('decide', () => {
  const four = [issue(1), issue(2), issue(3), issue(4)];

  it('refuse la quatrième issue en cours', () => {
    const r = decide({ issue: four[3], assignedIssues: four, prs: [], limit: 3 });
    expect(r.allowed).toBe(false);
    expect(r.current).toEqual([1, 2, 3, 4]);
  });
  it('accepte la troisième', () => {
    expect(decide({ issue: four[2], assignedIssues: four.slice(0, 3), prs: [], limit: 3 }).allowed).toBe(
      true,
    );
  });
  it('accepte une quatrième si une des trois autres est déjà en revue', () => {
    expect(decide({ issue: four[3], assignedIssues: four, prs: [pr('Closes #1')], limit: 3 }).allowed).toBe(
      true,
    );
  });
  it('n’applique jamais la limite à une issue exemptée (décision, humain…)', () => {
    const decision = issue(9, ['décision']);
    expect(decide({ issue: decision, assignedIssues: [...four, decision], prs: [], limit: 3 }).allowed).toBe(
      true,
    );
  });
  it('la limite par défaut est 3', () => {
    expect(decide({ issue: four[3], assignedIssues: four, prs: [] }).allowed).toBe(false);
    expect(decide({ issue: four[2], assignedIssues: four.slice(0, 3), prs: [] }).allowed).toBe(true);
  });
});
