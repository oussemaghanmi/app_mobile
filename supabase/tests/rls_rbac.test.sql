-- =============================================================
-- Tests RLS / RBAC (pgTAP) — lancer avec `supabase test db`
-- Chaque test s'exécute dans une transaction annulée à la fin.
-- =============================================================
begin;
create extension if not exists pgtap with schema extensions;

select plan(24);

-- ---------- Outils de test ----------
create schema if not exists tests;

-- Crée un utilisateur auth (le trigger crée le profil), puis fixe son rôle.
create or replace function tests.create_user(p_id uuid, p_role public.app_role, p_name text)
returns void language plpgsql as $$
begin
  insert into auth.users (id, email, aud, role)
  values (p_id, p_name || '@test.local', 'authenticated', 'authenticated');
  update public.profiles set role = p_role, first_name = p_name where id = p_id;
end $$;

-- Se connecte « en tant que » cet utilisateur (rôle Postgres authenticated + JWT simulé).
create or replace function tests.login_as(p_id uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', p_id, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
end $$;

create or replace function tests.logout() returns void language plpgsql as $$
begin
  execute 'reset role';
  perform set_config('request.jwt.claims', null, true);
end $$;

grant usage on schema tests to authenticated;
grant execute on all functions in schema tests to authenticated;

-- ---------- Jeu de données ----------
-- A, B : patients ; D : médecin affecté à A ; D2 : médecin non affecté ; N : infirmier affecté à A
select tests.create_user('00000000-0000-0000-0000-00000000000a', 'patient', 'patientA');
select tests.create_user('00000000-0000-0000-0000-00000000000b', 'patient', 'patientB');
select tests.create_user('00000000-0000-0000-0000-0000000000d1', 'doctor',  'docteur');
select tests.create_user('00000000-0000-0000-0000-0000000000d2', 'doctor',  'docteur2');
select tests.create_user('00000000-0000-0000-0000-0000000000e1', 'nurse',   'infirmier');

insert into public.care_assignments (patient_id, professional_id) values
  ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000000d1'),
  ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000000e1');

insert into public.symptom_logs (patient_id, pain_level, notes) values
  ('00000000-0000-0000-0000-00000000000a', 4, 'symptômes A'),
  ('00000000-0000-0000-0000-00000000000b', 7, 'symptômes B');
insert into public.mood_logs (patient_id, mood) values
  ('00000000-0000-0000-0000-00000000000a', 3),
  ('00000000-0000-0000-0000-00000000000b', 2);
insert into public.private_journal (patient_id, content) values
  ('00000000-0000-0000-0000-00000000000a', 'secret A'),
  ('00000000-0000-0000-0000-00000000000b', 'secret B');
insert into public.prescriptions (patient_id, prescribed_by, medication, dosage, times_of_day) values
  ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000000d1', 'Med A', '1 cp', '{08:00}'),
  ('00000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-0000000000d2', 'Med B', '1 cp', '{08:00}');

-- =============================================================
-- 1. Un patient ne lit pas les données d'un autre patient
-- =============================================================
select tests.login_as('00000000-0000-0000-0000-00000000000a');
select results_eq($$ select notes from public.symptom_logs $$, array['symptômes A'],
  'patient A : ne voit que ses propres symptômes');
select is((select count(*)::int from public.mood_logs), 1, 'patient A : ne voit que sa propre humeur');
select results_eq($$ select first_name from public.profiles $$, array['patientA'],
  'patient A : ne voit que son propre profil');
select results_eq($$ select medication from public.prescriptions $$, array['Med A'],
  'patient A : ne voit que ses propres prescriptions');
select results_eq($$ select content from public.private_journal $$, array['secret A'],
  'patient A : ne voit que son propre journal privé');

-- Écrire au nom d'un autre patient est refusé
select throws_ok(
  $$ insert into public.symptom_logs (patient_id, pain_level) values ('00000000-0000-0000-0000-00000000000b', 1) $$,
  '42501', null, 'patient A : ne peut pas écrire dans les symptômes de B');
select tests.logout();

-- =============================================================
-- 2. Un soignant ne lit que ses patients affectés
-- =============================================================
select tests.login_as('00000000-0000-0000-0000-0000000000d1');
select results_eq($$ select notes from public.symptom_logs $$, array['symptômes A'],
  'médecin affecté : ne voit que les symptômes de son patient');
select results_eq($$ select first_name from public.profiles order by first_name $$,
  array['docteur', 'patientA'], 'médecin : voit son profil et celui de son patient uniquement');
select is((select count(*)::int from public.mood_logs), 1, 'médecin : humeur du patient affecté seulement');
select tests.logout();

select tests.login_as('00000000-0000-0000-0000-0000000000d2');
select results_eq($$ select medication from public.prescriptions $$, array[]::text[],
  'médecin non affecté : ne voit aucune prescription (même celles qu''il a rédigées pour un patient non affecté)');
select is((select count(*)::int from public.symptom_logs), 0, 'médecin non affecté : aucun symptôme visible');
select tests.logout();

select tests.login_as('00000000-0000-0000-0000-0000000000e1');
select results_eq($$ select notes from public.symptom_logs $$, array['symptômes A'],
  'infirmier affecté : ne voit que les symptômes de son patient');
select tests.logout();

-- =============================================================
-- 3. Personne d'autre que le patient ne lit private_journal
-- =============================================================
select tests.login_as('00000000-0000-0000-0000-0000000000d1');
select is((select count(*)::int from public.private_journal), 0, 'médecin affecté : journal privé invisible');
select tests.logout();

select tests.login_as('00000000-0000-0000-0000-0000000000e1');
select is((select count(*)::int from public.private_journal), 0, 'infirmier affecté : journal privé invisible');
select tests.logout();

select tests.login_as('00000000-0000-0000-0000-00000000000b');
select results_eq($$ select content from public.private_journal $$, array['secret B'],
  'patient B : ne voit pas le journal privé de A');
select tests.logout();

-- Le rôle anonyme ne voit rien
set local role anon;
select is((select count(*)::int from public.private_journal), 0, 'anonyme : journal privé invisible');
reset role;

-- =============================================================
-- 4. Un patient ne peut pas changer son rôle
-- =============================================================
select tests.login_as('00000000-0000-0000-0000-00000000000a');
select throws_ok(
  $$ update public.profiles set role = 'doctor' where id = '00000000-0000-0000-0000-00000000000a' $$,
  '42501', null, 'patient : modifier son rôle est refusé');
select lives_ok(
  $$ update public.profiles set first_name = 'Amina' where id = '00000000-0000-0000-0000-00000000000a' $$,
  'patient : peut modifier son prénom');
select tests.logout();
select is((select role::text from public.profiles where id = '00000000-0000-0000-0000-00000000000a'),
  'patient', 'le rôle du patient est inchangé');

-- =============================================================
-- 5. Seul un médecin affecté peut écrire une prescription
-- =============================================================
select tests.login_as('00000000-0000-0000-0000-0000000000d1');
select lives_ok(
  $$ insert into public.prescriptions (patient_id, prescribed_by, medication, dosage, times_of_day)
     values ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000000d1', 'Nouveau', '1 cp', '{20:00}') $$,
  'médecin affecté : peut prescrire');
select throws_ok(
  $$ insert into public.prescriptions (patient_id, prescribed_by, medication, dosage, times_of_day)
     values ('00000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-0000000000d1', 'X', '1 cp', '{20:00}') $$,
  '42501', null, 'médecin : ne peut pas prescrire à un patient non affecté');
select tests.logout();

select tests.login_as('00000000-0000-0000-0000-0000000000e1');
select throws_ok(
  $$ insert into public.prescriptions (patient_id, prescribed_by, medication, dosage, times_of_day)
     values ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000000e1', 'X', '1 cp', '{20:00}') $$,
  '42501', null, 'infirmier affecté : ne peut pas prescrire');
select tests.logout();

select tests.login_as('00000000-0000-0000-0000-00000000000a');
select throws_ok(
  $$ insert into public.prescriptions (patient_id, prescribed_by, medication, dosage, times_of_day)
     values ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000a', 'X', '1 cp', '{20:00}') $$,
  '42501', null, 'patient : ne peut pas se prescrire');
-- Une mise à jour par le patient est silencieusement filtrée par RLS (0 ligne)
update public.prescriptions set dosage = '10 cp' where patient_id = '00000000-0000-0000-0000-00000000000a';
select tests.logout();
select is((select count(*)::int from public.prescriptions where dosage = '10 cp'), 0,
  'patient : ne peut pas modifier une prescription');

select * from finish();
rollback;
