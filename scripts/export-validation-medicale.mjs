#!/usr/bin/env node
// Exporte tous les textes médicaux/éducatifs de l'application dans un seul fichier Markdown,
// en 4 langues, pour la relecture par l'équipe soignante (issue « Validation médicale »).
// Usage : node scripts/export-validation-medicale.mjs [fichier-de-sortie]
// Sans argument, le résultat est écrit sur la sortie standard. Le fichier produit n'est pas
// versionné : il se régénère à chaque relecture pour refléter le contenu à jour.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const LOCALES = ['fr', 'en', 'ar', 'tn'];
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Préfixes de clés i18n qui portent un contenu médical ou éducatif. */
const SECTIONS = [
  { title: 'Ma maladie', prefixes: ['disease.'] },
  { title: "Signes d'alerte et urgence (190)", prefixes: ['emergency.'] },
  { title: 'Conseils — arrêt du tabac', prefixes: ['tips.tobacco.'] },
  { title: 'Alimentation — repères', prefixes: ['nutrition.foods.'] },
  { title: 'CrohnBot — avertissement et accueil', prefixes: ['bot.disclaimer', 'bot.welcome'] },
];

/** Contenus hors fichiers de langue : à relire directement dans le fichier. */
const FILES = [
  ['Conseils de vie (table tips)', 'supabase/migrations/0005_conseils.sql'],
  ['Recettes (table recipes)', 'supabase/migrations/0004_alimentation.sql'],
  ['Consignes du prompt de CrohnBot', 'supabase/functions/crohnbot/prompt.ts'],
];

function flatten(obj, prefix = '', out = new Map()) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, key, out);
    else out.set(key, String(v));
  }
  return out;
}

const maps = Object.fromEntries(
  LOCALES.map((l) => [
    l,
    flatten(JSON.parse(readFileSync(path.join(root, 'src/i18n/locales', `${l}.json`), 'utf8'))),
  ]),
);

const cell = (s) => (s ?? '—').replace(/\|/g, '\\|').replace(/\n/g, '<br>');

const lines = [
  '# Textes médicaux à valider',
  '',
  `Généré le ${new Date().toISOString().slice(0, 10)} par \`scripts/export-validation-medicale.mjs\`.`,
  "Pour chaque ligne : ✅ validé, ou correction demandée en commentaire de l'issue.",
  '',
];

for (const { title, prefixes } of SECTIONS) {
  const keys = [...maps.fr.keys()].filter((k) => prefixes.some((p) => k.startsWith(p)));
  lines.push(`## ${title}`, '', '| Clé | FR | EN | AR | TN | Validé |', '|---|---|---|---|---|---|');
  for (const k of keys) {
    lines.push(`| \`${k}\` | ${LOCALES.map((l) => cell(maps[l].get(k))).join(' | ')} | ☐ |`);
  }
  lines.push('');
}

lines.push('## Contenus à relire dans les fichiers', '');
for (const [title, file] of FILES) lines.push(`- ${title} : \`${file}\``);
lines.push('');

const output = lines.join('\n');
const target = process.argv[2];
if (target) {
  writeFileSync(target, output);
  console.log(`Export écrit dans ${target}`);
} else {
  process.stdout.write(output);
}
