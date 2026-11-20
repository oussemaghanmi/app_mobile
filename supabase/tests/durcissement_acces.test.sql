-- Migration 0011 : visiteur sans droit, prescriptions non réattribuables, affectation vers un vrai soignant.
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
create or replace function tests.login_anon() returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
  execute 'set local role anon';
end $$;
create or replace function tests.logout() returns void language plpgsql as $$
begin
  execute 'reset role';
  perform set_config('request.jwt.claims', null, true);
end $$;
grant usage on schema tests to anon, authenticated;
grant execute on all functions in schema tests to anon, authenticated;

-- A, A2 : patients ; D : médecin affecté à A et A2 ; P : un « soignant » resté patient.
select tests.create_user('00000000-0000-0000-0000-00000000000a', 'patient', 'A');
select tests.create_user('00000000-0000-0000-0000-0000000000a2', 'patient', 'A2');
select tests.create_user('00000000-0000-0000-0000-00000000000d', 'doctor', 'D');
select tests.create_user('00000000-0000-0000-0000-00000000000e', 'doctor', 'D2');
select tests.create_user('00000000-0000-0000-0000-00000000000f', 'patient', 'P');
insert into public.care_assignments (patient_id, professional_id) values
  ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000d'),
  ('00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-00000000000d'),
  ('00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-00000000000f');
insert into public.prescriptions (id, patient_id, prescribed_by, medication, dosage, times_of_day)
  values ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-00000000000a',
          '00000000-0000-0000-0000-00000000000d', 'médicament-test', 'dose-test', array['08:00']::time[]);

-- Visiteur
select tests.login_anon();
select throws_ok('select 1 from public.profiles', '42501', null, 'anon : lecture profiles refusée');
select throws_ok('select 1 from public.private_journal', '42501', null, 'anon : lecture private_journal refusée');
select throws_ok('select 1 from public.recipes', '42501', null, 'anon : lecture recipes refusée');
select throws_ok('select public.my_role()', '42501', null, 'anon : my_role() non exécutable');
select throws_ok('select public.generate_intakes(7)', '42501', null, 'anon : generate_intakes() non exécutable');
select tests.logout();

-- Un utilisateur connecté garde l'accès à ses fonctions
select tests.login_as('00000000-0000-0000-0000-00000000000d');
select is(public.my_role()::text, 'doctor', 'authenticated : my_role() fonctionne');
select throws_ok('select public.handle_new_user()', '42501', null, 'authenticated : handle_new_user() non appelable (trigger)');

-- Prescriptions : seuls les champs de traitement changent
select lives_ok($$update public.prescriptions set dosage = 'dose-modifiée'
  where id = '00000000-0000-0000-0000-0000000000b1'$$, 'D peut modifier la posologie');
select throws_ok($$update public.prescriptions set patient_id = '00000000-0000-0000-0000-0000000000a2'
  where id = '00000000-0000-0000-0000-0000000000b1'$$, '42501', null,
  'D ne peut pas réattribuer la prescription à un autre patient affecté');
select throws_ok($$update public.prescriptions set prescribed_by = '00000000-0000-0000-0000-00000000000e'
  where id = '00000000-0000-0000-0000-0000000000b1'$$, '42501', null, 'D ne peut pas changer le prescripteur');
select tests.logout();

-- Affectation vers un compte resté patient : aucun accès
select tests.login_as('00000000-0000-0000-0000-00000000000f');
select is(public.is_assigned_to('00000000-0000-0000-0000-0000000000a2'), false,
  'une affectation vers un compte patient ne donne pas accès');
select is((select count(*)::int from public.profiles where id = '00000000-0000-0000-0000-0000000000a2'), 0,
  'ce compte ne voit pas le profil du patient');
select tests.logout();

select * from finish();
rollback;
