-- Fonctions d'aide partagées par les tests RLS (schéma « tests », conservé entre les fichiers).
-- pgTAP est requis (déjà actif en local via `supabase test db`).
create extension if not exists pgtap with schema extensions;
-- Ce fichier passe en premier (ordre alphabétique) ; il n'est pas annulé par rollback.
create schema if not exists tests;
grant usage on schema tests to anon, authenticated, service_role;

-- Crée un utilisateur (le trigger crée son profil) puis fixe son rôle applicatif.
create or replace function tests.create_user(p_id uuid, p_role public.app_role default 'patient')
returns uuid language plpgsql as $$
begin
  insert into auth.users (id, email) values (p_id, p_id::text || '@test.local');
  update public.profiles set role = p_role where id = p_id;
  return p_id;
end $$;

-- Se connecte comme cet utilisateur (rôle API « authenticated » + claim sub).
create or replace function tests.login_as(p_id uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', p_id::text, true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);
  set local role authenticated;
end $$;

-- Se connecte comme visiteur non authentifié.
create or replace function tests.login_anon() returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('request.jwt.claim.role', 'anon', true);
  set local role anon;
end $$;

create or replace function tests.logout() returns void language plpgsql as $$
begin
  reset role;
  perform set_config('request.jwt.claim.sub', '', true);
end $$;

grant execute on all functions in schema tests to anon, authenticated, service_role;

-- Identifiants fixes lisibles : tests.u('p1') …
create or replace function tests.u(p_name text) returns uuid language sql immutable as $$
  select (case p_name
    when 'p1' then '00000000-0000-0000-0000-0000000000a1'
    when 'p2' then '00000000-0000-0000-0000-0000000000a2'
    when 'p3' then '00000000-0000-0000-0000-0000000000a3'
    when 'd1' then '00000000-0000-0000-0000-0000000000b1'
    when 'd2' then '00000000-0000-0000-0000-0000000000b2'
    when 'n1' then '00000000-0000-0000-0000-0000000000c1'
    when 'n2' then '00000000-0000-0000-0000-0000000000c2'
    when 'rx1' then '00000000-0000-0000-0000-0000000000e1'
  end)::uuid
$$;

-- Jour courant en Tunisie (fuseau de l'application).
create or replace function tests.today() returns date language sql stable as $$
  select (now() at time zone 'Africa/Tunis')::date
$$;

-- Jeu de données commun :
--   p1, p2 patients ; d1 médecin et n1 infirmier AFFECTÉS à p1 ; d2 médecin et n2 infirmier non affectés.
--   p1 : une prescription (rx1, prise à 08:00 et 20:00), un symptôme, une humeur, une observation de n1.
--   p1 et p2 : chacun une entrée de journal privé.
create or replace function tests.seed_fixtures() returns void language plpgsql as $$
begin
  perform tests.create_user(tests.u('p1'), 'patient');
  perform tests.create_user(tests.u('p2'), 'patient');
  perform tests.create_user(tests.u('d1'), 'doctor');
  perform tests.create_user(tests.u('d2'), 'doctor');
  perform tests.create_user(tests.u('n1'), 'nurse');
  perform tests.create_user(tests.u('n2'), 'nurse');
  insert into public.care_assignments (patient_id, professional_id)
    values (tests.u('p1'), tests.u('d1')), (tests.u('p1'), tests.u('n1'));
  insert into public.prescriptions (id, patient_id, prescribed_by, medication, dosage, times_of_day, start_date)
    values (tests.u('rx1'), tests.u('p1'), tests.u('d1'), 'médicament-test', 'dose-test',
            array['08:00', '20:00']::time[], tests.today());
  insert into public.symptom_logs (patient_id, pain_level, notes) values (tests.u('p1'), 3, 'symptôme p1');
  insert into public.mood_logs (patient_id, mood) values (tests.u('p1'), 4);
  insert into public.private_journal (patient_id, content)
    values (tests.u('p1'), 'journal p1'), (tests.u('p2'), 'journal p2');
  insert into public.nursing_notes (patient_id, nurse_id, content)
    values (tests.u('p1'), tests.u('n1'), 'observation n1');
  insert into public.tips (category, fr) values ('test', 'conseil de test');
end $$;

grant execute on all functions in schema tests to anon, authenticated, service_role;

select plan(1);
select ok(true, 'helpers de test installés');
select * from finish();
