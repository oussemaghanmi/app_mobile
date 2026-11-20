import { describe, expect, it } from 'vitest';
import { can, homePathFor } from './permissions';

describe('can', () => {
  it('interdit au patient de prescrire', () => {
    expect(can('patient', 'prescriptions:write')).toBe(false);
  });
  it('autorise le médecin à prescrire', () => {
    expect(can('doctor', 'prescriptions:write')).toBe(true);
  });
  it('refuse tout sans rôle', () => {
    expect(can(undefined, 'education:view')).toBe(false);
  });
  it("interdit à l'infirmier le journal privé", () => {
    expect(can('nurse', 'private_journal:use')).toBe(false);
  });
  it('interdit au médecin le journal privé', () => {
    expect(can('doctor', 'private_journal:use')).toBe(false);
  });
});

describe('homePathFor', () => {
  it.each([
    ['patient', '/patient'],
    ['doctor', '/doctor'],
    ['nurse', '/nurse'],
  ] as const)('%s -> %s', (role, path) => {
    expect(homePathFor(role)).toBe(path);
  });
});
