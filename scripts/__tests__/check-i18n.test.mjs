import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { checkI18n } from '../check-i18n.mjs';

function make(files) {
  const dir = mkdtempSync(join(tmpdir(), 'i18n-'));
  for (const [lang, obj] of Object.entries(files)) writeFileSync(join(dir, `${lang}.json`), JSON.stringify(obj));
  return dir;
}
const ok = {
  fr: { a: { b: 'Bonjour {{n}}' }, c: 'Salut' },
  en: { a: { b: 'Hello {{n}}' }, c: 'Hi' },
  ar: { a: { b: 'مرحبا {{n}}' }, c: 'سلام' },
  tn: { a: { b: 'عسلامة {{n}}' }, c: 'أهلا' },
};

test('4 langues cohérentes : aucune erreur', () => {
  assert.deepEqual(checkI18n(make(ok)), []);
});
test('clé manquante dans ar', () => {
  const e = checkI18n(make({ ...ok, ar: { a: { b: 'مرحبا {{n}}' } } }));
  assert.ok(e.some((m) => m.includes('ar.json') && m.includes('clé manquante « c »')));
});
test('valeur vide', () => {
  const e = checkI18n(make({ ...ok, en: { a: { b: 'Hello {{n}}' }, c: '  ' } }));
  assert.ok(e.some((m) => m.includes('en.json') && m.includes('valeur vide')));
});
test('tn identique au français', () => {
  const e = checkI18n(make({ ...ok, tn: { a: { b: 'Bonjour {{n}}' }, c: 'أهلا' } }));
  assert.ok(e.some((m) => m.includes('tn.json') && m.includes('identique au français')));
});
test('identique autorisé par la liste', () => {
  const e = checkI18n(make({ ...ok, tn: { a: { b: 'Bonjour {{n}}' }, c: 'أهلا' } }), { allowIdentical: ['a.b'] });
  assert.deepEqual(e, []);
});
test('variable {{n}} oubliée', () => {
  const e = checkI18n(make({ ...ok, en: { a: { b: 'Hello' }, c: 'Hi' } }));
  assert.ok(e.some((m) => m.includes('variables différentes')));
});
test('fichier de langue absent', () => {
  const { tn, ...rest } = ok;
  assert.ok(checkI18n(make(rest)).some((m) => m.includes('tn.json : fichier manquant')));
});
