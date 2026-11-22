// Contrastes du thème (issue #40, règle 6) : calculés depuis les jetons @theme de index.css, pour qu'un
// changement de couleur qui casserait la lisibilité fasse échouer la CI. Seuils WCAG 2.1 AA :
// 4,5:1 pour le texte, 3:1 pour les composants d'interface et les bordures.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const css = readFileSync(resolve(process.cwd(), 'src/styles/index.css'), 'utf8');

const token = (name: string): string => {
  const m = css.match(new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{6})`));
  if (!m) throw new Error(`jeton --color-${name} introuvable dans index.css`);
  return m[1];
};

const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const luminance = (hex: string) => {
  const [r, g, b] = rgb(hex).map((c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
/** Couleur `fg` à l'opacité `alpha` posée sur `bg` (ex. text-ink/70 sur fond crème). */
const blend = (fg: string, alpha: number, bg: string) =>
  '#' +
  rgb(fg)
    .map((c, i) => Math.round(c * alpha + rgb(bg)[i] * (1 - alpha)))
    .map((c) => c.toString(16).padStart(2, '0'))
    .join('');

const WHITE = '#ffffff';
const cream = token('cream');
const ink = token('ink');

describe('Contrastes du thème CronCare', () => {
  it.each([
    ['texte ink sur blanc', ink, WHITE],
    ['texte ink sur crème', ink, cream],
    ['texte secondaire ink/70 sur blanc', blend(ink, 0.7, WHITE), WHITE],
    ['texte secondaire ink/70 sur crème', blend(ink, 0.7, cream), cream],
    ['texte sage-dark sur blanc', token('sage-dark'), WHITE],
    ['texte sage-dark sur crème', token('sage-dark'), cream],
    ['texte terracotta-dark sur blanc', token('terracotta-dark'), WHITE],
    ['texte terracotta-dark sur crème', token('terracotta-dark'), cream],
    ['texte blanc sur bouton sage-dark', WHITE, token('sage-dark')],
    ['texte blanc sur bouton terracotta-dark', WHITE, token('terracotta-dark')],
  ])('%s : au moins 4,5:1', (_label, fg, bg) => {
    expect(ratio(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });

  it.each([
    ['bordure terracotta (alertes, boutons danger) sur blanc', token('terracotta'), WHITE],
    ['bordure des champs ink/55 sur blanc', blend(ink, 0.55, WHITE), WHITE],
    ['case à cocher et focus sage-dark sur blanc', token('sage-dark'), WHITE],
  ])('%s : au moins 3:1', (_label, fg, bg) => {
    expect(ratio(fg, bg)).toBeGreaterThanOrEqual(3);
  });
});
