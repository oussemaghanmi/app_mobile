begin;
create extension if not exists pgtap with schema extensions;
select plan(10);

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
grant usage on schema tests to authenticated;
grant execute on all functions in schema tests to authenticated;

select tests.create_user('00000000-0000-0000-0000-00000000000a', 'patient', 'patientA');
select tests.create_user('00000000-0000-0000-0000-00000000000b', 'patient', 'patientB');
select tests.create_user('00000000-0000-0000-0000-0000000000d1', 'doctor', 'docteur');
select tests.create_user('00000000-0000-0000-0000-0000000000d2', 'doctor', 'docteur2');
select tests.create_user('00000000-0000-0000-0000-0000000000e1', 'nurse', 'infirmier');
insert into public.care_assignments values
  ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000000d1'),
  ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000000e1');

select tests.login_as('00000000-0000-0000-0000-0000000000d1');
select lives_ok($$ insert into public.appointments (id, patient_id, starts_at, location)
                   values ('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000a', now() + interval '3 days', 'Hôpital') $$,
  'médecin affecté : crée un rendez-vous');
select throws_ok($$ insert into public.appointments (patient_id, starts_at) values ('00000000-0000-0000-0000-00000000000b', now()) $$,
  '42501', null, 'médecin : pas de rendez-vous pour un patient non affecté');
select tests.logout();

select tests.login_as('00000000-0000-0000-0000-0000000000e1');
select lives_ok($$ insert into public.appointments (patient_id, starts_at) values ('00000000-0000-0000-0000-00000000000a', now() + interval '5 days') $$,
  'infirmier affecté : crée un rendez-vous');
select is_empty($$ update public.appointments set location = 'X' where id = '30000000-0000-0000-0000-000000000001' returning id $$,
  'infirmier : ne modifie pas le rendez-vous créé par le médecin');
select tests.logout();

select tests.login_as('00000000-0000-0000-0000-00000000000a');
select is((select count(*)::int from public.appointments), 2, 'patient : voit ses rendez-vous');
select throws_ok($$ insert into public.appointments (patient_id, professional_id, starts_at)
                    values ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000000d1', now()) $$,
  '42501', null, 'patient : ne crée pas de rendez-vous');
select is_empty($$ delete from public.appointments returning id $$, 'patient : ne supprime pas de rendez-vous');
select tests.logout();

select tests.login_as('00000000-0000-0000-0000-00000000000b');
select is((select count(*)::int from public.appointments), 0, 'autre patient : aucun rendez-vous visible');
select tests.logout();

select tests.login_as('00000000-0000-0000-0000-0000000000d2');
select is((select count(*)::int from public.appointments), 0, 'médecin non affecté : aucun rendez-vous visible');
select tests.logout();

select tests.login_as('00000000-0000-0000-0000-0000000000d1');
select isnt_empty($$ delete from public.appointments where id = '30000000-0000-0000-0000-000000000001' returning id $$,
  'médecin auteur : supprime son rendez-vous');
select tests.logout();

select * from finish();
rollback;
