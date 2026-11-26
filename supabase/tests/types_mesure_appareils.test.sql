-- Types de mesure extensibles et registre d'appareils (0016, #134).
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

-- A et B patientes ; D médecin affecté à A ; X médecin non affecté
select tests.create_user('00000000-0000-0000-0000-0000000016a1', 'patient', 'typA');
select tests.create_user('00000000-0000-0000-0000-0000000016b1', 'patient', 'typB');
select tests.create_user('00000000-0000-0000-0000-0000000016d1', 'doctor', 'typDoc');
select tests.create_user('00000000-0000-0000-0000-0000000016f1', 'doctor', 'typAutre');
insert into public.care_assignments (patient_id, professional_id) values
  ('00000000-0000-0000-0000-0000000016a1', '00000000-0000-0000-0000-0000000016d1');
-- Données de B posées par le superutilisateur : appareil et type personnalisé
insert into public.health_devices (id, patient_id, display_name, connection) values
  ('60000000-0000-0000-0000-0000000016b1', '00000000-0000-0000-0000-0000000016b1', 'appareil de B', 'manual');
insert into public.measurement_types (code, value_count, units, patient_id, label) values
  ('custom_type_de_b', 1, '{u}', '00000000-0000-0000-0000-0000000016b1', 'type de B');

-- ---------- Types standard ----------
select has_table('public', 'measurement_types', 'la table measurement_types existe');
select has_table('public', 'health_devices', 'la table health_devices existe');
select is((select relrowsecurity from pg_class where oid = 'public.measurement_types'::regclass), true, 'RLS activé : measurement_types');
select is((select relrowsecurity from pg_class where oid = 'public.health_devices'::regclass), true, 'RLS activé : health_devices');
select is(
  (select array_agg(code order by code) from public.measurement_types where patient_id is null),
  array['blood_glucose', 'blood_pressure', 'body_temperature', 'body_weight', 'heart_rate', 'oxygen_saturation']::text[],
  'six types standard fournis par la migration');
select is((select value_count::int from public.measurement_types where code = 'blood_pressure'), 2, 'la tension a deux valeurs');
select is((select units from public.measurement_types where code = 'blood_glucose'), array['mg/dL', 'mmol/L']::text[], 'glycémie : deux unités');
select is((select count(*)::int from public.measurement_types where loinc_code is not null), 0, 'aucun code LOINC inventé');

-- ---------- Patiente A : type personnalisé ----------
select tests.login_as('00000000-0000-0000-0000-0000000016a1');
select is((select count(*)::int from public.measurement_types where patient_id is null), 6, 'A lit les 6 types standard');
select is((select count(*)::int from public.measurement_types), 6, 'A ne voit pas le type personnalisé de B');
select lives_ok($$ insert into public.measurement_types (value_count, units, label)
                   values (1, '{u,v}', 'Ma mesure') $$, 'A crée un type personnalisé (code et patient_id par défaut)');
select is((select code like 'custom\_%' from public.measurement_types where label = 'Ma mesure'), true, 'le code généré commence par custom_');
select is((select patient_id::text from public.measurement_types where label = 'Ma mesure'), '00000000-0000-0000-0000-0000000016a1',
  'le type personnalisé appartient à A par défaut');
select throws_ok($$ insert into public.measurement_types (code, value_count, units, patient_id)
                    values ('mon_standard', 1, '{u}', null) $$, '42501', null, 'A ne peut pas créer un type standard');
select throws_ok($$ insert into public.measurement_types (value_count, units, label, patient_id)
                    values (1, '{u}', 'au nom de B', '00000000-0000-0000-0000-0000000016b1') $$, '42501', null,
  'A ne peut pas créer un type au nom de B');
select throws_ok($$ insert into public.measurement_types (code, value_count, units, label)
                    values ('pas_custom', 1, '{u}', 'code libre') $$, '23514', null,
  'le code d''un type personnalisé doit commencer par custom_');
select throws_ok($$ insert into public.measurement_types (value_count, units) values (1, '{u}') $$, '23514', null,
  'un type personnalisé exige un nom');
select throws_ok($$ insert into public.measurement_types (value_count, units, label) values (3, '{u}', 'trois') $$, '23514', null,
  'une ou deux valeurs seulement');
select throws_ok($$ insert into public.measurement_types (value_count, units, label) values (1, '{}', 'sans unité') $$, '23514', null,
  'au moins une unité');
select throws_ok($$ update public.measurement_types set label = 'autre' where label = 'Ma mesure' $$, '42501', null,
  'un type n''est jamais modifié');

-- Mesures avec le type personnalisé et validation par le déclencheur
select lives_ok($$ insert into public.health_measurements (kind, value_1, unit, measured_at)
                   select code, 5, 'u', now() - interval '1 hour' from public.measurement_types where label = 'Ma mesure' $$,
  'A saisit une mesure avec son type personnalisé');
select throws_ok($$ insert into public.health_measurements (kind, value_1, unit, measured_at)
                    select code, 5, 'x', now() from public.measurement_types where label = 'Ma mesure' $$, '23514', null,
  'unité hors de la liste du type refusée');
select throws_ok($$ insert into public.health_measurements (kind, value_1, value_2, unit, measured_at)
                    select code, 5, 4, 'u', now() from public.measurement_types where label = 'Ma mesure' $$, '23514', null,
  'deuxième valeur refusée pour un type à une valeur');
select throws_ok($$ insert into public.health_measurements (kind, value_1, unit, measured_at)
                    values ('custom_type_de_b', 5, 'u', now()) $$, '23503', null, 'A ne peut pas utiliser le type personnalisé de B');
select throws_ok($$ insert into public.health_measurements (kind, value_1, unit, measured_at)
                    values ('inconnu', 5, 'u', now()) $$, '23503', null, 'type inconnu refusé');
select lives_ok($$ insert into public.health_measurements (kind, value_1, unit, measured_at)
                   values ('oxygen_saturation', 97, '%', now() - interval '1 hour') $$, 'type standard ajouté : saturation en oxygène');
select lives_ok($$ insert into public.health_measurements (kind, value_1, unit, measured_at)
                   values ('body_weight', 62.5, 'kg', now() - interval '1 hour') $$, 'type standard ajouté : poids');
select lives_ok($$ insert into public.measurement_types (value_count, units, label) values (2, '{mm}', 'Deux valeurs') $$,
  'A crée un type à deux valeurs');
select throws_ok($$ insert into public.health_measurements (kind, value_1, unit, measured_at)
                    select code, 5, 'mm', now() from public.measurement_types where label = 'Deux valeurs' $$, '23514', null,
  'type à deux valeurs sans deuxième valeur refusé');
select lives_ok($$ insert into public.health_measurements (kind, value_1, value_2, unit, measured_at)
                   select code, 5, 4, 'mm', now() - interval '1 hour' from public.measurement_types where label = 'Deux valeurs' $$,
  'type à deux valeurs avec ses deux valeurs');

-- Sources
select lives_ok($$ insert into public.health_measurements (kind, value_1, unit, measured_at, source)
                   values ('heart_rate', 70, 'bpm', now() - interval '5 hours', 'health_kit') $$, 'source health_kit acceptée');
select lives_ok($$ insert into public.health_measurements (kind, value_1, unit, measured_at, source)
                   values ('heart_rate', 71, 'bpm', now() - interval '6 hours', 'screen_scan') $$, 'source screen_scan acceptée');
select lives_ok($$ insert into public.health_measurements (kind, value_1, unit, measured_at, source)
                   values ('heart_rate', 72, 'bpm', now() - interval '7 hours', 'file_import') $$, 'source file_import acceptée');
select lives_ok($$ insert into public.health_measurements (kind, value_1, unit, measured_at, source)
                   values ('heart_rate', 73, 'bpm', now() - interval '8 hours', 'cloud_vendor') $$, 'source cloud_vendor acceptée');
select throws_ok($$ insert into public.health_measurements (kind, value_1, unit, measured_at, source)
                    values ('heart_rate', 74, 'bpm', now(), 'fax') $$, '23514', null, 'source inconnue refusée');

-- Suppression d'un type utilisé : refusée tant que des mesures l'utilisent
select throws_ok($$ delete from public.measurement_types where label = 'Ma mesure' $$, '23503', null,
  'un type utilisé par une mesure ne peut pas être supprimé');
select lives_ok($$ delete from public.health_measurements where unit = 'u' $$, 'A supprime la mesure');
select lives_ok($$ delete from public.measurement_types where label = 'Ma mesure' $$, 'puis le type devenu inutilisé');

-- ---------- Appareils ----------
select lives_ok($$ insert into public.health_devices (display_name, connection) values ('Montre', 'ble_standard') $$,
  'A enregistre un appareil');
select throws_ok($$ insert into public.health_devices (display_name, connection) values ('Machine', 'telepathie') $$, '23514', null,
  'moyen de connexion inconnu refusé');
select throws_ok($$ insert into public.health_devices (display_name, connection) values ('', 'manual') $$, '23514', null,
  'nom vide refusé');
select throws_ok($$ insert into public.health_devices (patient_id, display_name, connection)
                    values ('00000000-0000-0000-0000-0000000016b1', 'pour B', 'manual') $$, '42501', null,
  'A ne peut pas enregistrer un appareil au nom de B');
select is((select count(*)::int from public.health_devices), 1, 'A ne voit que son appareil');
select lives_ok($$ update public.health_devices set display_name = 'Ma montre', last_sync_at = now() $$,
  'A renomme son appareil et met à jour la dernière synchronisation');
select throws_ok($$ update public.health_devices set connection = 'manual' $$, '42501', null,
  'le moyen de connexion ne se modifie pas');
select throws_ok($$ update public.health_devices set patient_id = '00000000-0000-0000-0000-0000000016b1' $$, '42501', null,
  'un appareil ne peut pas être donné à un autre patient');
select lives_ok($$ insert into public.health_measurements (kind, value_1, unit, measured_at, device_id)
                   select 'heart_rate', 66, 'bpm', now() - interval '2 hours', id from public.health_devices $$,
  'A saisit une mesure rattachée à son appareil');
select throws_ok($$ insert into public.health_measurements (kind, value_1, unit, measured_at, device_id)
                    values ('heart_rate', 67, 'bpm', now(), '60000000-0000-0000-0000-0000000016b1') $$, '23514', null,
  'une mesure ne peut pas être rattachée à l''appareil de B');
select tests.logout();

-- ---------- B : ne voit rien de A ----------
select tests.login_as('00000000-0000-0000-0000-0000000016b1');
select is((select count(*)::int from public.health_devices), 1, 'B ne voit que son appareil');
select is((select display_name from public.health_devices), 'appareil de B', 'et c''est le sien');
select is((select count(*)::int from public.measurement_types where patient_id is not null), 1, 'B ne voit que son type personnalisé');
delete from public.health_devices;
select tests.logout();
select is((select count(*)::int from public.health_devices where patient_id = '00000000-0000-0000-0000-0000000016a1'), 1,
  'B ne peut pas supprimer l''appareil de A');

-- ---------- Médecin affecté : lecture seule ----------
select tests.login_as('00000000-0000-0000-0000-0000000016d1');
select is((select count(*)::int from public.health_devices where patient_id = '00000000-0000-0000-0000-0000000016a1'), 1,
  'médecin affecté : lit l''appareil de A');
select is((select count(*)::int from public.measurement_types where patient_id = '00000000-0000-0000-0000-0000000016a1'), 1,
  'médecin affecté : lit le type personnalisé restant de A');
select is((select count(*)::int from public.health_devices where patient_id = '00000000-0000-0000-0000-0000000016b1'), 0,
  'médecin affecté : pas l''appareil de B');
select throws_ok($$ insert into public.health_devices (patient_id, display_name, connection)
                    values ('00000000-0000-0000-0000-0000000016a1', 'pose soignant', 'manual') $$, '42501', null,
  'médecin : aucune création d''appareil');
select throws_ok($$ insert into public.measurement_types (value_count, units, label, patient_id)
                    values (1, '{u}', 'pose soignant', '00000000-0000-0000-0000-0000000016a1') $$, '42501', null,
  'médecin : aucune création de type');
select tests.logout();

-- ---------- Médecin non affecté ----------
select tests.login_as('00000000-0000-0000-0000-0000000016f1');
select is((select count(*)::int from public.health_devices), 0, 'médecin non affecté : aucun appareil');
select is((select count(*)::int from public.measurement_types where patient_id is not null), 0, 'médecin non affecté : aucun type personnalisé');
select is((select count(*)::int from public.measurement_types where patient_id is null), 6, 'mais les types standard');
select tests.logout();

-- ---------- Suppression d'un appareil : les mesures restent ----------
select tests.login_as('00000000-0000-0000-0000-0000000016a1');
select lives_ok($$ delete from public.health_devices $$, 'A supprime son appareil');
select is((select count(*)::int from public.health_measurements where value_1 = 66), 1, 'la mesure rattachée est conservée');
select is((select device_id from public.health_measurements where value_1 = 66), null, 'avec device_id remis à nul');
select tests.logout();

-- ---------- anon ----------
set local role anon;
select throws_ok($$ select count(*) from public.measurement_types $$, '42501', null, 'anon : aucun accès aux types');
select throws_ok($$ select count(*) from public.health_devices $$, '42501', null, 'anon : aucun accès aux appareils');
reset role;

-- ---------- Fonction de validation : non appelable ----------
select is(
  (select count(*)::int from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'health_measurements_validate'
      and (has_function_privilege('anon', p.oid, 'execute') or has_function_privilege('authenticated', p.oid, 'execute'))),
  0, 'le déclencheur de validation n''est exécutable ni par anon ni par authenticated');

select * from finish();
rollback;
