#!/usr/bin/env node
// Vérifie que les 4 fichiers de langue ont exactement les mêmes clés (et aucune valeur vide).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const LOCALES = ['fr', 'en', 'ar', 'tn'];
const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'i18n', 'locales');

/** Aplatit { a: { b: 'x' } } en Map { 'a.b' => 'x' }. */
function flatten(obj, prefix = '', out = new Map()) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, key, out);
    else out.set(key, v);
  }
  return out;
}

const maps = Object.fromEntries(
  LOCALES.map((l) => [l, flatten(JSON.parse(readFileSync(path.join(dir, `${l}.json`), 'utf8')))]),
);
const reference = maps.fr;
const errors = [];

for (const lang of LOCALES) {
  const keys = maps[lang];
  for (const k of reference.keys()) if (!keys.has(k)) errors.push(`[${lang}] clé manquante : ${k}`);
  for (const [k, v] of keys) {
    if (!reference.has(k)) errors.push(`[${lang}] clé absente de fr : ${k}`);
    if (typeof v !== 'string' || v.trim() === '') errors.push(`[${lang}] valeur vide : ${k}`);
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  console.error(`\n✗ i18n : ${errors.length} problème(s)`);
  process.exit(1);
}
console.log(`✓ i18n : ${reference.size} clés identiques dans ${LOCALES.join(', ')}`);
