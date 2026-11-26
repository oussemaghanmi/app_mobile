-- Tests de public.export_my_data() (migration 0013) : export complet des données de la personne connectée.
begin;
create extension if not exists pgtap with schema extensions;
select plan(30);

create schema if not exists tests;
create or replace function tests.create_user(p_id uuid, p_role public.app_role, p_name text)
returns void language plpgsql as $$
begin
  insert into auth.users (id, email, aud, role)
  values (p_id, p_name || '@test.local', 'authenticated', 'authenticated');
  update public.profiles set role = p_role, first_name = p_name, last_name = 'Test' where id = p_id;
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
grant usage on schema tests to authenticated;
grant execute on all functions in schema tests to authenticated;

-- A : patiente avec des données partout ; B : autre patiente ; C : patiente sans données
select tests.create_user('00000000-0000-0000-0000-0000000000a1', 'patient', 'exportA');
select tests.create_user('00000000-0000-0000-0000-0000000000b1', 'patient', 'exportB');
select tests.create_user('00000000-0000-0000-0000-0000000000c1', 'patient', 'exportC');
select tests.create_user('00000000-0000-0000-0000-0000000000d1', 'doctor', 'exportDoc');
select tests.create_user('00000000-0000-0000-0000-0000000000e1', 'nurse', 'exportNurse');

-- Jeu de données (inséré en superutilisateur : le RLS ne s'applique pas ici)
insert into public.care_assignments (patient_id, professional_id) values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000d1'),
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000e1'),
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000d1');

insert into public.prescriptions (id, patient_id, prescribed_by, medication, dosage, times_of_day) values
  ('10000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000a1',
   '00000000-0000-0000-0000-0000000000d1', 'MedA', '1 cp', '{08:00}'),
  ('10000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000b1',
   '00000000-0000-0000-0000-0000000000d1', 'MedB', '1 cp', '{08:00}');
insert into public.medication_intakes (prescription_id, patient_id, scheduled_at) values
  ('10000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000a1', now()),
  ('10000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000b1', now());
insert into public.mood_logs (patient_id, mood) values
  ('00000000-0000-0000-0000-0000000000a1', 4), ('00000000-0000-0000-0000-0000000000b1', 2);
insert into public.symptom_logs (patient_id, pain_level, notes) values
  ('00000000-0000-0000-0000-0000000000a1', 3, 'symptome-A'),
  ('00000000-0000-0000-0000-0000000000b1', 7, 'symptome-B');
insert into public.private_journal (patient_id, content) values
  ('00000000-0000-0000-0000-0000000000a1', 'journal-prive-A'),
  ('00000000-0000-0000-0000-0000000000b1', 'journal-prive-B');
insert into public.nursing_notes (patient_id, nurse_id, content) values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000e1', 'observation-A');
insert into public.appointments (patient_id, professional_id, starts_at) values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000d1', now() + interval '3 days'),
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000d1', now() + interval '3 days');
insert into public.community_profiles (user_id, pseudonym) values
  ('00000000-0000-0000-0000-0000000000a1', 'PseudoA'),
  ('00000000-0000-0000-0000-0000000000b1', 'PseudoB');
insert into public.community_posts (id, author_id, content, hidden) values
  ('20000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000a1', 'publication-A', false),
  ('20000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-0000000000a1', 'publication-A-masquee', true),
  ('20000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000b1', 'publication-B', false);
insert into public.community_comments (post_id, author_id, content) values
  ('20000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000a1', 'commentaire-A'),
  ('20000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000b1', 'commentaire-B');
insert into public.reports (reporter_id, post_id, reason) values
  ('00000000-0000-0000-0000-0000000000a1', '20000000-0000-0000-0000-0000000000b1', 'spam'),
  ('00000000-0000-0000-0000-0000000000b1', '20000000-0000-0000-0000-0000000000a1', 'spam');
insert into public.chatbot_usage (user_id, day, messages) values
  ('00000000-0000-0000-0000-0000000000a1', current_date, 5),
  ('00000000-0000-0000-0000-0000000000b1', current_date, 9);
insert into public.health_measurements (patient_id, kind, value_1, unit, measured_at) values
  ('00000000-0000-0000-0000-0000000000a1', 'heart_rate', 72, 'bpm', now() - interval '1 hour'),
  ('00000000-0000-0000-0000-0000000000b1', 'heart_rate', 99, 'bpm', now() - interval '1 hour');
-- Types personnalisés et appareils (0016)
insert into public.measurement_types (code, value_count, units, patient_id, label) values
  ('custom_export_a', 1, '{u}', '00000000-0000-0000-0000-0000000000a1', 'type-perso-A'),
  ('custom_export_b', 1, '{u}', '00000000-0000-0000-0000-0000000000b1', 'type-perso-B');
insert into public.health_devices (patient_id, display_name, connection) values
  ('00000000-0000-0000-0000-0000000000a1', 'appareil-A', 'manual'),
  ('00000000-0000-0000-0000-0000000000b1', 'appareil-B', 'manual');

-- ---------- Contrat de la fonction ----------
select has_function('public', 'export_my_data', array[]::text[], 'export_my_data() existe');
select is(
  (select prosecdef from pg_proc where oid = 'public.export_my_data()'::regprocedure),
  false, 'export_my_data est security invoker (le RLS reste la barrière)');

-- ---------- Patiente A : toutes ses données, rien d'autre ----------
select tests.login_as('00000000-0000-0000-0000-0000000000a1');
create temp table export_a as select public.export_my_data() as j;
grant select on export_a to authenticated;

select is(
  (select array_agg(k order by k) from export_a, jsonb_object_keys(j) k),
  array['appointments', 'care_assignments', 'chatbot_usage', 'community_comments', 'community_posts',
        'community_profiles', 'health_devices', 'health_measurements', 'measurement_types',
        'medication_intakes', 'mood_logs', 'nursing_notes',
        'prescriptions', 'private_journal', 'profiles', 'reports', 'symptom_logs']::text[],
  'les 17 clés exactes');

select is((select jsonb_array_length(j->'profiles') from export_a), 1, 'profiles : sa ligne');
select is((select j->'profiles'->0->>'id' from export_a), '00000000-0000-0000-0000-0000000000a1', 'profiles : la bonne personne');
select is((select jsonb_array_length(j->'care_assignments') from export_a), 2, 'care_assignments : ses 2 soignants');
select is((select jsonb_array_length(j->'prescriptions') from export_a), 1, 'prescriptions');
select is((select jsonb_array_length(j->'medication_intakes') from export_a), 1, 'medication_intakes');
select is((select jsonb_array_length(j->'mood_logs') from export_a), 1, 'mood_logs');
select is((select j->'symptom_logs'->0->>'notes' from export_a), 'symptome-A', 'symptom_logs');
select is((select j->'private_journal'->0->>'content' from export_a), 'journal-prive-A', 'private_journal : le sien');
select is((select j->'nursing_notes'->0->>'content' from export_a), 'observation-A', 'nursing_notes');
select is((select jsonb_array_length(j->'appointments') from export_a), 1, 'appointments');
select is((select j->'community_profiles'->0->>'pseudonym' from export_a), 'PseudoA', 'community_profiles');
select is(
  (select array_agg(p->>'content' order by p->>'content') from export_a, jsonb_array_elements(j->'community_posts') p),
  array['publication-A', 'publication-A-masquee'], 'community_posts : les siennes, y compris la masquée');
select is((select j->'community_comments'->0->>'content' from export_a), 'commentaire-A', 'community_comments : les siens');
select is((select jsonb_array_length(j->'community_comments') from export_a), 1, 'community_comments : pas ceux d''autrui sur ses publications');
select is((select jsonb_array_length(j->'reports') from export_a), 1, 'reports : ses signalements');
select is((select j->'chatbot_usage'->0->>'messages' from export_a), '5', 'chatbot_usage');
select is((select jsonb_array_length(j->'health_measurements') from export_a), 1, 'health_measurements : sa mesure');
select is((select j->'health_measurements'->0->>'value_1' from export_a), '72', 'health_measurements : pas celle de B');
select is(
  (select array_agg(t->>'label') from export_a, jsonb_array_elements(j->'measurement_types') t),
  array['type-perso-A'], 'measurement_types : seulement son type personnalisé (ni le type de B, ni les types standard)');
select is(
  (select array_agg(d->>'display_name') from export_a, jsonb_array_elements(j->'health_devices') d),
  array['appareil-A'], 'health_devices : seulement son appareil');
select is((select count(*)::int from export_a, jsonb_array_elements(j->'measurement_types') t where t->>'patient_id' is null), 0,
  'les types standard (communs) ne sont pas des données personnelles');
select ok(
  (select position('00000000-0000-0000-0000-0000000000b1' in j::text) = 0
      and position('-B' in j::text) = 0 from export_a),
  'aucune donnée de la patiente B (ni journal privé, ni publication, ni consommation)');
select tests.logout();

-- ---------- Patiente C sans données : toutes les clés valent [] sauf son profil ----------
select tests.login_as('00000000-0000-0000-0000-0000000000c1');
select is(
  (select count(*)::int from jsonb_each(public.export_my_data()) e
    where e.key <> 'profiles' and e.value <> '[]'::jsonb),
  0, 'sans données : chaque clé (hors profil) vaut [], jamais null');
select tests.logout();

-- ---------- Médecin : seulement sa propre ligne profiles ----------
select tests.login_as('00000000-0000-0000-0000-0000000000d1');
select is(
  (select public.export_my_data()->'profiles'->0->>'id'),
  '00000000-0000-0000-0000-0000000000d1', 'médecin : sa propre ligne profiles');
select is(
  (select count(*)::int from jsonb_each(public.export_my_data()) e
    where e.key <> 'profiles' and e.value <> '[]'::jsonb),
  0, 'médecin : aucune donnée de patient (pas même celles des patients affectés)');
select tests.logout();

-- ---------- anon ----------
set local role anon;
select throws_ok($$ select public.export_my_data() $$, '42501', null, 'anon ne peut pas appeler la fonction');
reset role;

-- ---------- Privilèges ----------
select ok(
  not has_function_privilege('public', 'public.export_my_data()', 'execute'),
  'le rôle public n''a pas le droit d''exécution');

select * from finish();
rollback;
