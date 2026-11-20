-- Fonctions d'aide partagées par les tests RLS (schéma « tests », conservé entre les fichiers).
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

select plan(1);
select ok(true, 'helpers de test installés');
select * from finish();
