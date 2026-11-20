#!/usr/bin/env node
// Interdit les classes Tailwind physiques (règle CLAUDE.md n°5) : utiliser ms-/me-/ps-/pe-/start-/end-/
// border-s/text-start… pour que l'interface s'inverse correctement en arabe et en darija.
// Une ligne contenant « rtl-ignore » est ignorée (cas justifié et commenté).
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const T = String.raw`(?<![\w-])`; // début de classe (variantes « md: » comprises)
const PATTERNS = [
  [new RegExp(`${T}-?(?:m|p)[lr]-(?:\\d|\\[|px\\b|auto\\b)`), 'ml/mr/pl/pr → ms/me/ps/pe'],
  [new RegExp(`${T}-?(?:left|right)-(?:\\d|\\[|full\\b|1/2\\b|px\\b|auto\\b)`), 'left/right → start/end'],
  [new RegExp(`${T}text-(?:left|right)\\b`), 'text-left/right → text-start/end'],
  [new RegExp(`${T}float-(?:left|right)\\b`), 'float-left/right → float-start/end'],
  [new RegExp(`${T}border-[lr](?:-|\\b(?!-))`), 'border-l/r → border-s/e'],
  [new RegExp(`${T}rounded-(?:l|r|tl|tr|bl|br)(?:-|\\b(?!-))`), 'rounded-l/r/tl/tr/bl/br → rounded-s/e/ss/se/es/ee'],
  [new RegExp(`${T}scroll-m[lr]-`), 'scroll-ml/mr → scroll-ms/me'],
];
const EXT = new Set(['.ts', '.tsx', '.css', '.html']);

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* walk(p);
    else if (EXT.has(p.slice(p.lastIndexOf('.')))) yield p;
  }
}

/** @param {string} srcDir @returns {string[]} erreurs « fichier:ligne : … » */
export function checkRtl(srcDir) {
  const errors = [];
  for (const file of walk(srcDir)) {
    readFileSync(file, 'utf8')
      .split('\n')
      .forEach((line, i) => {
        if (line.includes('rtl-ignore')) return;
        for (const [re, hint] of PATTERNS) {
          const m = line.match(re);
          if (m) errors.push(`${relative(srcDir, file)}:${i + 1} : « ${m[0]} » (${hint})`);
        }
      });
  }
  return errors;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = resolve(fileURLToPath(import.meta.url), '..', '..');
  const errors = checkRtl(join(root, 'frontend', 'src'));
  if (errors.length) {
    console.error(errors.map((e) => `✗ ${e}`).join('\n'));
    process.exit(1);
  }
  console.log('✓ RTL : aucune classe physique');
}
