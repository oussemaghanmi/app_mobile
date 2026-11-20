import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { checkRtl } from '../check-rtl.mjs';

function src(content) {
  const dir = mkdtempSync(join(tmpdir(), 'rtl-'));
  writeFileSync(join(dir, 'A.tsx'), content);
  return dir;
}

test('classes logiques : aucune erreur', () => {
  assert.deepEqual(checkRtl(src('<div className="ms-2 pe-4 start-0 text-start border-s rounded-ss-lg md:me-3" />')), []);
});
for (const bad of ['ml-2', 'pr-4', 'left-0', 'right-1/2', 'text-left', 'border-r', 'rounded-l-lg', 'md:ml-2', '-mr-1', 'float-right']) {
  test(`classe physique refusée : ${bad}`, () => {
    assert.equal(checkRtl(src(`<div className="${bad}" />`)).length, 1);
  });
}
test('faux positifs évités', () => {
  assert.deepEqual(checkRtl(src('<div className="p-4 mt-2 rounded-lg border border-black/5 pl_x text-center" />')), []);
});
test('rtl-ignore autorise une ligne', () => {
  assert.deepEqual(checkRtl(src('<div className="ml-2" /> {/* rtl-ignore : icône fixe */}')), []);
});
