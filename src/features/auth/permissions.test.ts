import { can, homePathFor } from './permissions';

describe('permissions (matrice RBAC front)', () => {
  it('seul le médecin peut écrire une prescription', () => {
    expect(can('doctor', 'prescriptions:write')).toBe(true);
    expect(can('nurse', 'prescriptions:write')).toBe(false);
    expect(can('patient', 'prescriptions:write')).toBe(false);
  });

  it("seul l'infirmier rédige des observations", () => {
    expect(can('nurse', 'nursing_notes:write')).toBe(true);
    expect(can('doctor', 'nursing_notes:write')).toBe(false);
  });

  it('le journal privé est réservé au patient', () => {
    expect(can('patient', 'private_journal:use')).toBe(true);
    expect(can('doctor', 'private_journal:use')).toBe(false);
    expect(can('nurse', 'private_journal:use')).toBe(false);
  });

  it('refuse tout sans rôle', () => {
    expect(can(undefined, 'education:view')).toBe(false);
  });

  it("redirige chaque rôle vers son espace d'accueil", () => {
    expect(homePathFor('patient')).toBe('/patient');
    expect(homePathFor('doctor')).toBe('/doctor');
    expect(homePathFor('nurse')).toBe('/nurse');
  });
});
