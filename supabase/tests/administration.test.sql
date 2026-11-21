-- Administration (0012) : rôles et affectations gérés par des fonctions réservées à service_role.
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
grant usage on schema tests to anon, authenticated, service_role;
grant execute on all functions in schema tests to anon, authenticated, service_role;

-- P patient, P2 patient, U futur médecin (profil patient à la création), D médecin, N infirmière.
select tests.create_user('00000000-0000-0000-0000-0000000000a1', 'patient', 'P');
select tests.create_user('00000000-0000-0000-0000-0000000000a2', 'patient', 'P2');
select tests.create_user('00000000-0000-0000-0000-0000000000a3', 'patient', 'U');
select tests.create_user('00000000-0000-0000-0000-0000000000d1', 'doctor', 'D');
select tests.create_user('00000000-0000-0000-0000-0000000000c1', 'nurse', 'N');

-- ---------- Personne d'autre que service_role ne peut les appeler ----------
select tests.login_as('00000000-0000-0000-0000-0000000000a1');
select throws_ok($$select public.admin_set_role('00000000-0000-0000-0000-0000000000a1', 'doctor')$$, '42501', null,
  'un patient ne peut pas se promouvoir avec admin_set_role');
select throws_ok($$select public.admin_assign('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000a1')$$,
  '42501', null, 'un patient ne peut pas appeler admin_assign');
select throws_ok($$select public.admin_unassign('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000d1')$$,
  '42501', null, 'un patient ne peut pas appeler admin_unassign');
select tests.logout();
select tests.login_as('00000000-0000-0000-0000-0000000000d1');
select throws_ok($$select public.admin_assign('00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-0000000000d1')$$,
  '42501', null, 'un médecin ne peut pas s''affecter un patient');
select tests.logout();
set local role anon;
select throws_ok($$select public.admin_set_role('00000000-0000-0000-0000-0000000000a1', 'doctor')$$, '42501', null,
  'anon ne peut pas appeler admin_set_role');
reset role;

-- Aucune fonction admin_* n'est exécutable par anon ni authenticated (garde-fou pour les fonctions futures).
select is(
  (select coalesce(string_agg(p.proname, ', ' order by p.proname), '')
     from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname like 'admin\_%'
      and (has_function_privilege('anon', p.oid, 'execute') or has_function_privilege('authenticated', p.oid, 'execute'))),
  '', 'aucune fonction admin_* n''est exécutable par anon ou authenticated');
select is(
  (select count(*)::int from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname like 'admin\_%' and has_function_privilege('service_role', p.oid, 'execute')),
  3, 'les 3 fonctions admin_* sont exécutables par service_role');

-- ---------- service_role : promotion ----------
set local role service_role;
select lives_ok($$select public.admin_set_role('00000000-0000-0000-0000-0000000000a3', 'doctor')$$,
  'service_role promeut U en médecin');
select throws_ok($$select public.admin_set_role('00000000-0000-0000-0000-0000000000ff', 'doctor')$$, 'P0001', null,
  'compte inexistant refusé');
reset role;
select is((select role::text from public.profiles where id = '00000000-0000-0000-0000-0000000000a3'), 'doctor',
  'U est maintenant médecin');

-- ---------- service_role : affectation ----------
set local role service_role;
select lives_ok($$select public.admin_assign('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000d1')$$,
  'affecter le médecin D au patient P');
select lives_ok($$select public.admin_assign('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000d1')$$,
  'affecter deux fois est sans effet (idempotent)');
select lives_ok($$select public.admin_assign('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c1')$$,
  'affecter l''infirmière N au patient P');
select throws_ok($$select public.admin_assign('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000a2')$$,
  'P0001', null, 'un compte patient ne peut pas être « soignant »');
select throws_ok($$select public.admin_assign('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000c1')$$,
  'P0001', null, 'on n''affecte pas un soignant à un soignant');
select throws_ok($$select public.admin_assign('00000000-0000-0000-0000-0000000000ff', '00000000-0000-0000-0000-0000000000d1')$$,
  'P0001', null, 'patient inexistant refusé');
reset role;
select is((select count(*)::int from public.care_assignments), 2, 'deux affectations enregistrées');

-- L'affectation donne bien accès au médecin, et seulement à lui
select tests.login_as('00000000-0000-0000-0000-0000000000d1');
select is((select count(*)::int from public.profiles where id = '00000000-0000-0000-0000-0000000000a1'), 1,
  'D voit désormais P');
select is((select count(*)::int from public.profiles where id = '00000000-0000-0000-0000-0000000000a2'), 0,
  'D ne voit pas P2');
select tests.logout();

-- ---------- Changements de rôle incohérents refusés ----------
set local role service_role;
select throws_ok($$select public.admin_set_role('00000000-0000-0000-0000-0000000000a1', 'doctor')$$, 'P0001', null,
  'un patient affecté à des soignants ne devient pas soignant');
select throws_ok($$select public.admin_set_role('00000000-0000-0000-0000-0000000000d1', 'patient')$$, 'P0001', null,
  'un soignant affecté à des patients ne redevient pas patient');
select lives_ok($$select public.admin_set_role('00000000-0000-0000-0000-0000000000c1', 'doctor')$$,
  'infirmière → médecin reste possible (affectations conservées)');
reset role;

-- ---------- Désaffectation ----------
set local role service_role;
select lives_ok($$select public.admin_unassign('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000d1')$$,
  'désaffecter D de P');
select lives_ok($$select public.admin_unassign('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000d1')$$,
  'désaffecter deux fois est sans effet');
reset role;
select tests.login_as('00000000-0000-0000-0000-0000000000d1');
select is((select count(*)::int from public.profiles where id = '00000000-0000-0000-0000-0000000000a1'), 0,
  'D ne voit plus P après la désaffectation');
select tests.logout();
select is((select count(*)::int from public.care_assignments), 1, 'il reste l''affectation de N');

select * from finish();
rollback;
