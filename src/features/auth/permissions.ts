// Matrice RBAC côté front — sert UNIQUEMENT à adapter l'interface.
// La vraie barrière de sécurité est le RLS dans supabase/migrations.
import type { Role } from './types';

export type { Role };

export type Permission =
  | 'medications:view'
  | 'prescriptions:write'
  | 'symptoms:write'
  | 'symptoms:view_assigned'
  | 'private_journal:use'
  | 'nursing_notes:write'
  | 'patients:view_assigned'
  | 'education:view';

const MATRIX: Record<Role, Permission[]> = {
  patient: ['medications:view', 'symptoms:write', 'private_journal:use', 'education:view'],
  doctor: [
    'medications:view',
    'prescriptions:write',
    'symptoms:view_assigned',
    'patients:view_assigned',
    'education:view',
  ],
  nurse: [
    'medications:view',
    'symptoms:view_assigned',
    'nursing_notes:write',
    'patients:view_assigned',
    'education:view',
  ],
};

export const can = (role: Role | undefined, perm: Permission) => !!role && MATRIX[role].includes(perm);

export const homePathFor = (role: Role) =>
  role === 'patient' ? '/patient' : role === 'doctor' ? '/doctor' : '/nurse';
