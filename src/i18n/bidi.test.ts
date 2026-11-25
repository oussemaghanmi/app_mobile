// Ordre bidirectionnel (#102) : en arabe et en darija, un texte qui commence par des chiffres latins suivis d'un
// deux-points s'affiche à l'envers (« :10 أقصى ألم »). Les repères de l'échelle de douleur placent donc le nombre
// entre parenthèses après les mots.
import ar from './locales/ar.json';
import tn from './locales/tn.json';

describe('Échelle de douleur en RTL', () => {
  it.each([
    ['ar', ar],
    ['tn', tn],
  ])('%s : les repères 0 et 10 ne commencent pas par « nombre : »', (_lang, locale) => {
    const { painNone, painMax } = locale.journal.symptoms;
    for (const text of [painNone, painMax]) expect(text).not.toMatch(/^\d+\s*:/);
    expect(painNone).toContain('(0)');
    expect(painMax).toContain('(10)');
  });
});
