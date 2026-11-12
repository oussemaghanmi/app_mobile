-- =============================================================
-- Tests pgTAP — génération des prises (migration 0002)
-- =============================================================
begin;
create extension if not exists pgtap with schema extensions;

select plan(16);

create schema if not exists tests;
create or replace function tests.create_user(p_id uuid, p_role public.app_role, p_name text)
returns void language plpgsql as $$
begin
  insert into auth.users (id, email, aud, role)
  values (p_id, p_name || '@test.local', 'authenticated', 'authenticated');
  update public.profiles set role = p_role, first_name = p_name where id = p_id;
end $$;
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

select tests.create_user('00000000-0000-0000-0000-00000000000a', 'patient', 'patientA');
select tests.create_user('00000000-0000-0000-0000-00000000000b', 'patient', 'patientB');
select tests.create_user('00000000-0000-0000-0000-0000000000d1', 'doctor',  'docteur');
insert into public.care_assignments values
  ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000000d1');

-- A : 2 prises / jour, sans fin ; une prescription inactive ; une qui finit demain.
-- B : 1 prise / jour.
insert into public.prescriptions (id, patient_id, prescribed_by, medication, dosage, times_of_day, start_date, end_date, active) values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000000d1',
   'Med A', '1 cp', '{08:00,20:00}', current_date - 10, null, true),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000000d1',
   'Ancien', '1 cp', '{12:00}', current_date - 10, null, false),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000000d1',
   'Court', '1 cp', '{09:00}', current_date - 1, (now() at time zone 'Africa/Tunis')::date + 1, true),
  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-0000000000d1',
   'Med B', '1 cp', '{08:00}', current_date - 10, null, true);

-- ---------- Génération ----------
select tests.login_as('00000000-0000-0000-0000-00000000000a');
select is(public.generate_intakes(7), 16, 'patient A : 7 jours × 2 prises + 2 jours × 1 prise = 16');
select is(public.generate_intakes(7), 0, 'deuxième appel : aucun doublon');
select is((select count(*)::int from public.medication_intakes), 16, 'patient A voit ses 16 prises');
select is((select count(*)::int from public.medication_intakes
           where prescription_id = '10000000-0000-0000-0000-000000000002'), 0,
  'aucune prise pour une prescription inactive');
select is((select count(*)::int from public.medication_intakes
           where prescription_id = '10000000-0000-0000-0000-000000000003'), 2,
  'la date de fin est respectée');
select is(
  (select to_char(min(scheduled_at) at time zone 'Africa/Tunis', 'HH24:MI') from public.medication_intakes
   where prescription_id = '10000000-0000-0000-0000-000000000001'),
  '08:00', 'les horaires sont en heure tunisienne');
select throws_ok($$ select public.generate_intakes(0) $$, '22023', null, 'p_days hors bornes refusé');
select throws_ok($$ select public.generate_intakes(365) $$, '22023', null, 'p_days > 31 refusé');
select tests.logout();

-- La génération ne concerne que le patient connecté
select is((select count(*)::int from public.medication_intakes
           where patient_id = '00000000-0000-0000-0000-00000000000b'), 0,
  'la génération de A ne crée rien pour B');

-- ---------- Écriture ----------
select tests.login_as('00000000-0000-0000-0000-00000000000a');
select throws_ok(
  $$ insert into public.medication_intakes (prescription_id, patient_id, scheduled_at)
     values ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000a', now()) $$,
  '42501', null, 'insertion directe interdite (passer par generate_intakes)');
select lives_ok(
  $$ update public.medication_intakes set status = 'taken', taken_at = now()
     where id = (select id from public.medication_intakes order by scheduled_at limit 1) $$,
  'patient : peut cocher « Pris »');
select throws_ok(
  $$ update public.medication_intakes set scheduled_at = now() + interval '1 day' $$,
  '42501', null, 'patient : ne peut pas déplacer une prise');
select tests.logout();

select tests.login_as('00000000-0000-0000-0000-00000000000b');
update public.medication_intakes set status = 'taken'
  where patient_id = '00000000-0000-0000-0000-00000000000a';
select tests.logout();
select is((select count(*)::int from public.medication_intakes where status = 'taken'), 1,
  'patient B : ne peut pas cocher les prises de A');

-- ---------- Désactivation ----------
select tests.login_as('00000000-0000-0000-0000-0000000000d1');
update public.prescriptions set active = false where id = '10000000-0000-0000-0000-000000000001';
select tests.logout();
select is((select count(*)::int from public.medication_intakes
           where prescription_id = '10000000-0000-0000-0000-000000000001'
             and status = 'pending' and scheduled_at > now()), 0,
  'désactivation : prises futures en attente supprimées');
select is((select count(*)::int from public.medication_intakes
           where prescription_id = '10000000-0000-0000-0000-000000000001' and status = 'taken'), 1,
  'désactivation : historique des prises cochées conservé');

-- anonyme
set local role anon;
select throws_ok($$ select public.generate_intakes(7) $$, '42501', null, 'anonyme : generate_intakes interdit');
reset role;

select * from finish();
rollback;
