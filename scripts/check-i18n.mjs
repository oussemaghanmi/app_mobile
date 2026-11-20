#!/usr/bin/env node
// Vérifie les fichiers de langue (règle CLAUDE.md n°4) :
//  - mêmes clés dans fr / en / ar / tn ;
//  - aucune valeur vide ;
//  - mêmes variables {{x}} dans chaque langue ;
//  - pas de valeur recopiée du français (traduction réelle exigée).
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REFERENCE = 'fr';
const LANGS = ['fr', 'en', 'ar', 'tn'];

function flatten(obj, prefix = '') {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object') Object.assign(out, flatten(v, key));
    else out[key] = v;
  }
  return out;
}

const vars = (s) => [...String(s).matchAll(/\{\{\s*(\w+)\s*\}\}/g)].map((m) => m[1]).sort().join(',');
const hasLetters = (s) => /\p{L}/u.test(String(s).replace(/\{\{[^}]*\}\}/g, ''));

/** @param {string} dir dossier contenant fr.json, en.json, ar.json, tn.json
 *  @param {{allowIdentical?: string[]}} [opts] clés autorisées à rester identiques au français
 *  @returns {string[]} erreurs */
export function checkI18n(dir, opts = {}) {
  const allow = new Set(opts.allowIdentical ?? []);
  const errors = [];
  const files = readdirSync(dir);
  const tables = {};
  for (const lang of LANGS) {
    if (!files.includes(`${lang}.json`)) {
      errors.push(`${lang}.json : fichier manquant`);
      continue;
    }
    try {
      tables[lang] = flatten(JSON.parse(readFileSync(join(dir, `${lang}.json`), 'utf8')));
    } catch (e) {
      errors.push(`${lang}.json : JSON invalide (${e.message})`);
    }
  }
  const ref = tables[REFERENCE];
  if (!ref) return errors;
  for (const lang of LANGS) {
    const t = tables[lang];
    if (!t) continue;
    for (const key of Object.keys(ref)) {
      if (!(key in t)) errors.push(`${lang}.json : clé manquante « ${key} »`);
    }
    for (const [key, value] of Object.entries(t)) {
      if (!(key in ref)) errors.push(`${lang}.json : clé en trop « ${key} »`);
      if (typeof value !== 'string' || value.trim() === '') {
        errors.push(`${lang}.json : valeur vide pour « ${key} »`);
        continue;
      }
      if (key in ref && typeof ref[key] === 'string' && vars(value) !== vars(ref[key])) {
        errors.push(`${lang}.json : variables différentes pour « ${key} »`);
      }
      if (
        lang !== REFERENCE &&
        key in ref &&
        value === ref[key] &&
        hasLetters(value) &&
        !allow.has(key)
      ) {
        errors.push(`${lang}.json : « ${key} » est identique au français (traduction réelle exigée)`);
      }
    }
  }
  return errors;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = resolve(fileURLToPath(import.meta.url), '..', '..');
  const dir = join(root, 'frontend', 'src', 'i18n', 'locales');
  let allowIdentical = [];
  try {
    allowIdentical = JSON.parse(readFileSync(join(dir, '..', 'identical-allowed.json'), 'utf8'));
  } catch {
    /* liste facultative */
  }
  const errors = checkI18n(dir, { allowIdentical });
  if (errors.length) {
    console.error(errors.map((e) => `✗ ${e}`).join('\n'));
    process.exit(1);
  }
  console.log('✓ i18n : 4 langues cohérentes');
}
