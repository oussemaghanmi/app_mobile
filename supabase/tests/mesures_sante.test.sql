-- Mesures de santé (0015) : table health_measurements, contraintes techniques et règles d'accès.
begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

create schema if not exists tests;
create or replace function tests.create_user(p_id uuid, p_role public.app_role, p_name text)
returns void language plpgsql as $$
begin
  insert into auth.users (id, email, aud, role) values (p_id, p_name || '@test.local', 'authenticated', 'authenticated');
  update public.profiles set role = p_role, first_name = p_name where id = p_id;
end $$;
create or replace function tests.login_as(p_id uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p_id, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
end $$;
create or replace function tests.logout() returns void language plpgsql as $$
begin
  execute 'reset role';
  perform set_config('request.jwt.claims', null, true);
end $$;
grant usage on schema tests to anon, authenticated;
grant execute on all functions in schema tests to anon, authenticated;

-- A et B patientes ; D médecin affecté à A ; N infirmière affectée à A ; X médecin non affecté
select tests.create_user('00000000-0000-0000-0000-0000000013a1', 'patient', 'mesA');
select tests.create_user('00000000-0000-0000-0000-0000000013b1', 'patient', 'mesB');
select tests.create_user('00000000-0000-0000-0000-0000000013d1', 'doctor', 'mesDoc');
select tests.create_user('00000000-0000-0000-0000-0000000013e1', 'nurse', 'mesNurse');
select tests.create_user('00000000-0000-0000-0000-0000000013f1', 'doctor', 'mesAutre');
insert into public.care_assignments (patient_id, professional_id) values
  ('00000000-0000-0000-0000-0000000013a1', '00000000-0000-0000-0000-0000000013d1'),
  ('00000000-0000-0000-0000-0000000013a1', '00000000-0000-0000-0000-0000000013e1');

select has_table('public', 'health_measurements', 'la table health_measurements existe');
select is((select relrowsecurity from pg_class where oid = 'public.health_measurements'::regclass), true, 'RLS activé');

-- ---------- Patiente A : saisie de ses mesures ----------
select tests.login_as('00000000-0000-0000-0000-0000000013a1');
select lives_ok($$ insert into public.health_measurements (kind, value_1, unit, measured_at)
                   values ('heart_rate', 72, 'bpm', now() - interval '1 hour') $$, 'fréquence cardiaque en bpm');
select lives_ok($$ insert into public.health_measurements (kind, value_1, value_2, unit, measured_at)
                   values ('blood_pressure', 120, 80, 'mmHg', now() - interval '1 hour') $$, 'tension systolique / diastolique en mmHg');
select lives_ok($$ insert into public.health_measurements (kind, value_1, unit, measured_at)
                   values ('blood_glucose', 95, 'mg/dL', now() - interval '1 hour') $$, 'glycémie en mg/dL');
select lives_ok($$ insert into public.health_measurements (kind, value_1, unit, measured_at)
                   values ('blood_glucose', 5.3, 'mmol/L', now() - interval '1 hour') $$, 'glycémie en mmol/L (conservée telle quelle)');
select is((select patient_id::text from public.health_measurements limit 1), '00000000-0000-0000-0000-0000000013a1',
  'patient_id vaut auth.uid() par défaut');
select is((select source from public.health_measurements limit 1), 'manual', 'source manual par défaut');
select is((select value_1 from public.health_measurements where unit = 'mmol/L'), 5.3::numeric, 'aucune conversion silencieuse de la glycémie');

-- Contraintes techniques (aucun seuil médical)
select throws_ok($$ insert into public.health_measurements (kind, value_1, unit, measured_at)
                    values ('temperature', 37, 'C', now()) $$, '23503', null, 'type de mesure inconnu refusé (clé étrangère vers measurement_types)');
select throws_ok($$ insert into public.health_measurements (kind, value_1, unit, measured_at)
                    values ('blood_pressure', 120, 'mmHg', now()) $$, '23514', null, 'tension sans diastolique refusée');
select throws_ok($$ insert into public.health_measurements (kind, value_1, value_2, unit, measured_at)
                    values ('heart_rate', 72, 60, 'bpm', now()) $$, '23514', null, 'value_2 interdit hors tension');
select throws_ok($$ insert into public.health_measurements (kind, value_1, unit, measured_at)
                    values ('heart_rate', -5, 'bpm', now()) $$, '23514', null, 'valeur négative refusée');
select throws_ok($$ insert into public.health_measurements (kind, value_1, unit, measured_at)
                    values ('heart_rate', 0, 'bpm', now()) $$, '23514', null, 'valeur nulle refusée (strictement positive)');
select throws_ok($$ insert into public.health_measurements (kind, value_1, value_2, unit, measured_at)
                    values ('blood_pressure', 120, -1, 'mmHg', now()) $$, '23514', null, 'diastolique négative refusée');
select throws_ok($$ insert into public.health_measurements (kind, value_1, unit, measured_at)
                    values ('heart_rate', 72, 'mmHg', now()) $$, '23514', null, 'unité incohérente avec le type refusée');
select throws_ok($$ insert into public.health_measurements (kind, value_1, unit, measured_at)
                    values ('blood_glucose', 95, 'g/L', now()) $$, '23514', null, 'unité de glycémie non prévue refusée');
select throws_ok($$ insert into public.health_measurements (kind, value_1, unit, measured_at)
                    values ('heart_rate', 72, 'bpm', now() + interval '1 hour') $$, '23514', null, 'mesure dans le futur refusée');
select lives_ok($$ insert into public.health_measurements (kind, value_1, unit, measured_at)
                   values ('heart_rate', 70, 'bpm', now() + interval '2 minutes') $$, 'tolérance d''horloge de quelques minutes');
select throws_ok($$ insert into public.health_measurements (kind, value_1, unit, measured_at, source)
                    values ('heart_rate', 72, 'bpm', now(), 'fax') $$, '23514', null, 'source inconnue refusée');

-- Doublons de synchronisation
select lives_ok($$ insert into public.health_measurements (kind, value_1, unit, measured_at, source, source_ref)
                   values ('heart_rate', 80, 'bpm', now() - interval '2 hours', 'health_connect', 'hc-1') $$,
  'mesure Health Connect avec source_ref');
select throws_ok($$ insert into public.health_measurements (kind, value_1, unit, measured_at, source, source_ref)
                    values ('heart_rate', 80, 'bpm', now() - interval '2 hours', 'health_connect', 'hc-1') $$,
  '23505', null, 'même (patient, source, source_ref) refusé');
select lives_ok($$ insert into public.health_measurements (kind, value_1, unit, measured_at, source, source_ref)
                   values ('heart_rate', 81, 'bpm', now() - interval '3 hours', 'ble', 'hc-1') $$,
  'même source_ref pour une autre source accepté');

-- Pas de modification ; suppression de ses propres mesures
select throws_ok($$ update public.health_measurements set value_1 = 999 $$, '42501', null,
  'aucune mesure ne peut être modifiée (aucun droit de mise à jour)');
select throws_ok($$ insert into public.health_measurements (patient_id, kind, value_1, unit, measured_at)
                    values ('00000000-0000-0000-0000-0000000013b1', 'heart_rate', 72, 'bpm', now()) $$,
  '42501', null, 'impossible d''ajouter une mesure pour une autre patiente');
select lives_ok($$ delete from public.health_measurements where unit = 'mmol/L' $$, 'A supprime une de ses mesures');
select is((select count(*)::int from public.health_measurements), 6, 'A voit ses 6 mesures restantes (7 saisies, 1 supprimée)');
select tests.logout();

-- ---------- Patiente B : ne voit pas les mesures de A ----------
select tests.login_as('00000000-0000-0000-0000-0000000013b1');
select lives_ok($$ insert into public.health_measurements (kind, value_1, unit, measured_at)
                   values ('heart_rate', 65, 'bpm', now()) $$, 'B saisit sa mesure');
select is((select count(*)::int from public.health_measurements), 1, 'B ne voit que sa mesure');
delete from public.health_measurements where patient_id = '00000000-0000-0000-0000-0000000013a1';
select tests.logout();
select is((select count(*)::int from public.health_measurements where patient_id = '00000000-0000-0000-0000-0000000013a1'), 6,
  'B ne peut pas supprimer les mesures de A');
select tests.login_as('00000000-0000-0000-0000-0000000013b1');
select tests.logout();

-- ---------- Soignants ----------
select tests.login_as('00000000-0000-0000-0000-0000000013d1');
select is((select count(*)::int from public.health_measurements), 6, 'médecin affecté : lit les mesures de A, pas celles de B');
select throws_ok($$ insert into public.health_measurements (patient_id, kind, value_1, unit, measured_at)
                    values ('00000000-0000-0000-0000-0000000013a1', 'heart_rate', 72, 'bpm', now()) $$,
  '42501', null, 'médecin affecté : aucune saisie');
delete from public.health_measurements;
select tests.logout();
select is((select count(*)::int from public.health_measurements), 7, 'médecin affecté : aucune suppression (6 de A + 1 de B)');
select tests.login_as('00000000-0000-0000-0000-0000000013d1');
select tests.logout();

select tests.login_as('00000000-0000-0000-0000-0000000013e1');
select is((select count(*)::int from public.health_measurements), 6, 'infirmière affectée : lit les mesures de A');
select tests.logout();

select tests.login_as('00000000-0000-0000-0000-0000000013f1');
select is((select count(*)::int from public.health_measurements), 0, 'médecin non affecté : ne voit rien');
select tests.logout();

-- ---------- anon ----------
set local role anon;
select throws_ok($$ select count(*) from public.health_measurements $$, '42501', null, 'anon : aucun accès');
reset role;

select * from finish();
rollback;
