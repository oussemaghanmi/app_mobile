import axe from 'axe-core';

/**
 * Lance axe-core sur un rendu de test et renvoie les violations « serious » ou « critical »,
 * sous forme de lignes lisibles (règle, impact, éléments). Tableau vide = conforme pour l'issue #40.
 * Limite : jsdom ne calcule pas les couleurs rendues, axe classe donc color-contrast en « incomplete » ;
 * les contrastes du thème sont vérifiés à part (docs/DESIGN.md).
 */
export async function seriousViolations(container: Element): Promise<string[]> {
  const result = await axe.run(container, { resultTypes: ['violations'] });
  return result.violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => `${v.id} (${v.impact}) : ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`);
}
