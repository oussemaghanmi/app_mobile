-- Tests de public.delete_my_account() : la suppression du compte d'une patiente efface toutes ses données
-- (cascades depuis auth.users) et uniquement les siennes.
begin;
create extension if not exists pgtap with schema extensions;
select plan(25);

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

-- A : patiente qui supprime son compte ; B : autre patiente ; médecin affecté à A et B ; infirmière affectée à A
select tests.create_user('00000000-0000-0000-0000-00000000aaa1', 'patient', 'supprA');
select tests.create_user('00000000-0000-0000-0000-00000000bbb1', 'patient', 'supprB');
select tests.create_user('00000000-0000-0000-0000-00000000ddd1', 'doctor', 'supprDoc');
select tests.create_user('00000000-0000-0000-0000-00000000eee1', 'nurse', 'supprNurse');

-- Une ligne au moins par table pour A, et des données pour B (inséré en superutilisateur)
insert into public.care_assignments (patient_id, professional_id) values
  ('00000000-0000-0000-0000-00000000aaa1', '00000000-0000-0000-0000-00000000ddd1'),
  ('00000000-0000-0000-0000-00000000aaa1', '00000000-0000-0000-0000-00000000eee1'),
  ('00000000-0000-0000-0000-00000000bbb1', '00000000-0000-0000-0000-00000000ddd1');
insert into public.prescriptions (id, patient_id, prescribed_by, medication, dosage, times_of_day) values
  ('30000000-0000-0000-0000-00000000aaa1', '00000000-0000-0000-0000-00000000aaa1',
   '00000000-0000-0000-0000-00000000ddd1', 'MedA', '1 cp', '{08:00}'),
  ('30000000-0000-0000-0000-00000000bbb1', '00000000-0000-0000-0000-00000000bbb1',
   '00000000-0000-0000-0000-00000000ddd1', 'MedB', '1 cp', '{08:00}');
insert into public.medication_intakes (prescription_id, patient_id, scheduled_at) values
  ('30000000-0000-0000-0000-00000000aaa1', '00000000-0000-0000-0000-00000000aaa1', now()),
  ('30000000-0000-0000-0000-00000000bbb1', '00000000-0000-0000-0000-00000000bbb1', now());
insert into public.mood_logs (patient_id, mood) values
  ('00000000-0000-0000-0000-00000000aaa1', 3), ('00000000-0000-0000-0000-00000000bbb1', 4);
insert into public.symptom_logs (patient_id, pain_level) values
  ('00000000-0000-0000-0000-00000000aaa1', 5), ('00000000-0000-0000-0000-00000000bbb1', 2);
insert into public.private_journal (patient_id, content) values
  ('00000000-0000-0000-0000-00000000aaa1', 'journal A'), ('00000000-0000-0000-0000-00000000bbb1', 'journal B');
insert into public.nursing_notes (patient_id, nurse_id, content) values
  ('00000000-0000-0000-0000-00000000aaa1', '00000000-0000-0000-0000-00000000eee1', 'observation A');
insert into public.appointments (patient_id, professional_id, starts_at) values
  ('00000000-0000-0000-0000-00000000aaa1', '00000000-0000-0000-0000-00000000ddd1', now() + interval '2 days'),
  ('00000000-0000-0000-0000-00000000bbb1', '00000000-0000-0000-0000-00000000ddd1', now() + interval '2 days');
insert into public.community_profiles (user_id, pseudonym) values
  ('00000000-0000-0000-0000-00000000aaa1', 'SupprA'), ('00000000-0000-0000-0000-00000000bbb1', 'SupprB');
insert into public.community_posts (id, author_id, content) values
  ('40000000-0000-0000-0000-00000000aaa1', '00000000-0000-0000-0000-00000000aaa1', 'publication A'),
  ('40000000-0000-0000-0000-00000000bbb1', '00000000-0000-0000-0000-00000000bbb1', 'publication B');
insert into public.community_comments (post_id, author_id, content) values
  ('40000000-0000-0000-0000-00000000bbb1', '00000000-0000-0000-0000-00000000aaa1', 'commentaire de A sous B'),
  ('40000000-0000-0000-0000-00000000bbb1', '00000000-0000-0000-0000-00000000bbb1', 'commentaire de B sous B');
insert into public.reports (reporter_id, post_id, reason) values
  ('00000000-0000-0000-0000-00000000aaa1', '40000000-0000-0000-0000-00000000bbb1', 'spam');
insert into public.chatbot_usage (user_id, day, messages) values
  ('00000000-0000-0000-0000-00000000aaa1', current_date, 3), ('00000000-0000-0000-0000-00000000bbb1', current_date, 7);

-- ---------- anon ne peut pas appeler la fonction ----------
set local role anon;
select throws_ok($$ select public.delete_my_account() $$, '42501', null, 'anon ne peut pas appeler delete_my_account()');
reset role;

-- ---------- A supprime son compte ----------
select tests.login_as('00000000-0000-0000-0000-00000000aaa1');
select lives_ok($$ select public.delete_my_account() $$, 'A supprime son compte');
select tests.logout();

-- ---------- Plus aucune ligne de A (vérifié en superutilisateur) ----------
select is((select count(*)::int from auth.users where id = '00000000-0000-0000-0000-00000000aaa1'), 0, 'auth.users : A supprimée');
select is((select count(*)::int from public.profiles where id = '00000000-0000-0000-0000-00000000aaa1'), 0, 'profiles');
select is((select count(*)::int from public.care_assignments where patient_id = '00000000-0000-0000-0000-00000000aaa1'), 0, 'care_assignments');
select is((select count(*)::int from public.prescriptions where patient_id = '00000000-0000-0000-0000-00000000aaa1'), 0, 'prescriptions');
select is((select count(*)::int from public.medication_intakes where patient_id = '00000000-0000-0000-0000-00000000aaa1'), 0, 'medication_intakes');
select is((select count(*)::int from public.mood_logs where patient_id = '00000000-0000-0000-0000-00000000aaa1'), 0, 'mood_logs');
select is((select count(*)::int from public.symptom_logs where patient_id = '00000000-0000-0000-0000-00000000aaa1'), 0, 'symptom_logs');
select is((select count(*)::int from public.private_journal where patient_id = '00000000-0000-0000-0000-00000000aaa1'), 0, 'private_journal');
select is((select count(*)::int from public.nursing_notes where patient_id = '00000000-0000-0000-0000-00000000aaa1'), 0, 'nursing_notes');
select is((select count(*)::int from public.appointments where patient_id = '00000000-0000-0000-0000-00000000aaa1'), 0, 'appointments');
select is((select count(*)::int from public.community_profiles where user_id = '00000000-0000-0000-0000-00000000aaa1'), 0, 'community_profiles');
select is((select count(*)::int from public.community_posts where author_id = '00000000-0000-0000-0000-00000000aaa1'), 0, 'community_posts');
select is((select count(*)::int from public.community_comments where author_id = '00000000-0000-0000-0000-00000000aaa1'), 0, 'community_comments (dont celui sous la publication de B)');
select is((select count(*)::int from public.reports where reporter_id = '00000000-0000-0000-0000-00000000aaa1'), 0, 'reports');
select is((select count(*)::int from public.chatbot_usage where user_id = '00000000-0000-0000-0000-00000000aaa1'), 0, 'chatbot_usage');

-- ---------- Les données de B, du médecin et de l'infirmière sont intactes ----------
select is((select count(*)::int from public.community_posts where id = '40000000-0000-0000-0000-00000000bbb1'), 1, 'la publication de B existe toujours');
select is((select count(*)::int from public.community_comments where author_id = '00000000-0000-0000-0000-00000000bbb1'), 1, 'le commentaire de B sous sa publication existe toujours');
select is((select content from public.private_journal where patient_id = '00000000-0000-0000-0000-00000000bbb1'), 'journal B', 'journal privé de B intact');
select is(
  (select count(*)::int from public.prescriptions p join public.medication_intakes i on i.prescription_id = p.id
    where p.patient_id = '00000000-0000-0000-0000-00000000bbb1'), 1, 'prescription et prise de B intactes');
select is(
  (select (select count(*) from public.mood_logs where patient_id = '00000000-0000-0000-0000-00000000bbb1')
        + (select count(*) from public.symptom_logs where patient_id = '00000000-0000-0000-0000-00000000bbb1')
        + (select count(*) from public.appointments where patient_id = '00000000-0000-0000-0000-00000000bbb1')
        + (select count(*) from public.chatbot_usage where user_id = '00000000-0000-0000-0000-00000000bbb1'))::int,
  4, 'humeur, symptômes, rendez-vous et consommation CrohnBot de B intacts');
select is((select pseudonym from public.community_profiles where user_id = '00000000-0000-0000-0000-00000000bbb1'), 'SupprB', 'pseudonyme de B intact');
select is((select count(*)::int from public.profiles where id in ('00000000-0000-0000-0000-00000000ddd1', '00000000-0000-0000-0000-00000000eee1')),
  2, 'les comptes du médecin et de l''infirmière existent toujours');
select is((select count(*)::int from public.care_assignments where professional_id = '00000000-0000-0000-0000-00000000ddd1'),
  1, 'l''affectation du médecin à B est conservée');

select * from finish();
rollback;
