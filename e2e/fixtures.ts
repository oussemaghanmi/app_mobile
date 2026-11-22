import { adminClient } from './env';

export const PASSWORD = 'E2e-Passw0rd!';

/** Texte unique placé dans le journal privé de la patiente : il ne doit apparaître que chez elle. */
export const PRIVATE_MARKER = 'SECRET-PRIVE-E2E-6f2c1a';
export const MEDICATION = 'Test-Med-E2E';

export const USERS = {
  patient: { email: 'amel.e2e@croncare.test', first: 'Amel', last: 'E2E' },
  stranger: { email: 'sami.e2e@croncare.test', first: 'Sami', last: 'E2E' },
  doctor: { email: 'docteur.e2e@croncare.test', first: 'Docteur', last: 'E2E' },
  nurse: { email: 'infirmiere.e2e@croncare.test', first: 'Infirmiere', last: 'E2E' },
} as const;

/** Date et heure à Tunis (fuseau de l'application), au format YYYY-MM-DD et HH:MM. */
export function tunisParts(date: Date) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Africa/Tunis',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(date)
      .map((p) => [p.type, p.value]),
  );
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` };
}

/** Passé 23 h 50, la prise « dans 5 minutes » tomberait le lendemain : le parcours « Pris » est alors ignoré. */
export const intakeFlowPossible = (now = new Date()) => tunisParts(now).time < '23:50';

type Admin = ReturnType<typeof adminClient>;
/** Échoue avec un message clair si une requête d'administration a renvoyé une erreur. */
function check(r: { error: { message: string } | null }, what: string) {
  if (r.error) throw new Error(`${what} : ${r.error.message}`);
}

async function deleteIfExists(admin: Admin, email: string) {
  const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  const existing = data?.users.find((u) => u.email === email);
  if (existing) check(await admin.auth.admin.deleteUser(existing.id), `suppression de ${email}`);
}

async function createUser(admin: Admin, u: { email: string; first: string; last: string }) {
  await deleteIfExists(admin, u.email);
  const created = await admin.auth.admin.createUser({
    email: u.email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { first_name: u.first },
  });
  if (created.error || !created.data.user) {
    throw new Error(`création de ${u.email} : ${created.error?.message ?? 'aucun utilisateur renvoyé'}`);
  }
  const id = created.data.user.id;
  check(await admin.from('profiles').update({ last_name: u.last }).eq('id', id), `nom de ${u.email}`);
  return id;
}

/**
 * Jeu de données de test (base locale) : une patiente suivie par un médecin et une infirmière, une patiente
 * sans soignant, une prescription dont la prise tombe dans 5 minutes, une entrée de journal privé.
 * Les rôles et affectations passent par les fonctions d'administration (migration 0012), comme en production.
 */
export async function seed() {
  const admin = adminClient();
  const patient = await createUser(admin, USERS.patient);
  await createUser(admin, USERS.stranger); // patiente sans soignant : personne ne doit la voir
  const doctor = await createUser(admin, USERS.doctor);
  const nurse = await createUser(admin, USERS.nurse);
  check(await admin.rpc('admin_set_role', { p_user: doctor, p_role: 'doctor' }), 'rôle médecin');
  check(await admin.rpc('admin_set_role', { p_user: nurse, p_role: 'nurse' }), 'rôle infirmière');
  check(
    await admin.rpc('admin_assign', { p_patient: patient, p_professional: doctor }),
    'affectation médecin',
  );
  check(
    await admin.rpc('admin_assign', { p_patient: patient, p_professional: nurse }),
    'affectation infirmière',
  );

  const soon = tunisParts(new Date(Date.now() + 5 * 60_000));
  check(
    await admin.from('prescriptions').insert({
      patient_id: patient,
      prescribed_by: doctor,
      medication: MEDICATION,
      dosage: 'dose-e2e',
      times_of_day: [`${soon.time}:00`],
      start_date: tunisParts(new Date()).date,
    }),
    'prescription',
  );
  check(
    await admin.from('private_journal').insert({ patient_id: patient, content: PRIVATE_MARKER }),
    'journal privé',
  );
}
