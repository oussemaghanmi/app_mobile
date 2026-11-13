begin;
create extension if not exists pgtap with schema extensions;
select plan(21);

create schema if not exists tests;
create or replace function tests.create_user(p_id uuid, p_role public.app_role, p_name text)
returns void language plpgsql as $$
begin
  insert into auth.users (id, email, aud, role)
  values (p_id, p_name || '@test.local', 'authenticated', 'authenticated');
  update public.profiles set role = p_role, first_name = p_name, last_name = 'NomRéel' where id = p_id;
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
select tests.create_user('00000000-0000-0000-0000-00000000000c', 'patient', 'patientC');
select tests.create_user('00000000-0000-0000-0000-00000000000e', 'patient', 'patientE');
select tests.create_user('00000000-0000-0000-0000-0000000000d1', 'doctor', 'docteur');

-- ---------- Pseudonymes ----------
select tests.login_as('00000000-0000-0000-0000-00000000000a');
select throws_ok($$ insert into public.community_posts (content) values ('sans pseudo') $$,
  '23503', null, 'pas de publication sans pseudonyme');
select lives_ok($$ insert into public.community_profiles (pseudonym) values ('Jasmin_21') $$, 'A choisit un pseudonyme');
select throws_ok($$ insert into public.community_profiles (user_id, pseudonym)
                    values ('00000000-0000-0000-0000-00000000000b', 'Usurpe') $$,
  '42501', null, 'impossible de créer le pseudonyme de quelqu''un d''autre');
select tests.logout();

select tests.login_as('00000000-0000-0000-0000-00000000000b');
select throws_ok($$ insert into public.community_profiles (pseudonym) values ('jasmin_21') $$,
  '23505', null, 'pseudonyme unique (insensible à la casse)');
select throws_ok($$ insert into public.community_profiles (pseudonym) values ('<script>') $$,
  '23514', null, 'format de pseudonyme contrôlé');
select lives_ok($$ insert into public.community_profiles (pseudonym) values ('Olivier') $$, 'B choisit un pseudonyme');
select tests.logout();

select tests.login_as('00000000-0000-0000-0000-0000000000d1');
select throws_ok($$ insert into public.community_profiles (pseudonym) values ('DrX') $$,
  '42501', null, 'un soignant ne participe pas à la communauté entre patients');
select tests.logout();

select tests.login_as('00000000-0000-0000-0000-00000000000c');
insert into public.community_profiles (pseudonym) values ('Palmier');
select tests.logout();
select tests.login_as('00000000-0000-0000-0000-00000000000e');
insert into public.community_profiles (pseudonym) values ('Mimosa');
select tests.logout();

-- ---------- Publications ----------
select tests.login_as('00000000-0000-0000-0000-00000000000a');
insert into public.community_posts (id, content) values ('20000000-0000-0000-0000-000000000001', 'Bonjour à tous');
select throws_ok($$ insert into public.community_posts (author_id, content)
                    values ('00000000-0000-0000-0000-00000000000b', 'au nom de B') $$,
  '42501', null, 'impossible de publier au nom d''un autre');
select throws_ok($$ update public.community_posts set hidden = false $$, '42501', null,
  'l''auteur ne peut pas modifier le masquage');
select tests.logout();

select tests.login_as('00000000-0000-0000-0000-00000000000b');
select is((select count(*)::int from public.community_posts), 1, 'B lit les publications');
select is_empty($$ update public.community_posts set content = 'modifié par B' returning id $$,
  'B ne peut pas modifier la publication de A');
select is_empty($$ delete from public.community_posts returning id $$, 'B ne peut pas supprimer la publication de A');
select lives_ok($$ insert into public.community_comments (post_id, content)
                   values ('20000000-0000-0000-0000-000000000001', 'Bienvenue !') $$, 'B commente');
-- Le nom réel n'est pas accessible par la communauté
select is((select count(*)::int from public.profiles where id = '00000000-0000-0000-0000-00000000000a'), 0,
  'B ne peut pas lire le profil (nom réel) de A');
select is((select pseudonym from public.community_profiles where user_id = '00000000-0000-0000-0000-00000000000a'),
  'Jasmin_21', 'B voit uniquement le pseudonyme de A');
select tests.logout();

select tests.login_as('00000000-0000-0000-0000-0000000000d1');
select is((select count(*)::int from public.community_posts), 1, 'un soignant connecté peut lire');
select throws_ok($$ insert into public.community_posts (content) values ('x') $$, '42501', null,
  'un soignant ne publie pas');
select tests.logout();

-- ---------- Signalements ----------
select tests.login_as('00000000-0000-0000-0000-00000000000b');
insert into public.reports (post_id, reason) values ('20000000-0000-0000-0000-000000000001', 'spam');
select throws_ok($$ insert into public.reports (post_id, reason) values ('20000000-0000-0000-0000-000000000001', 'spam') $$,
  '23505', null, 'un seul signalement par personne et par publication');
select tests.logout();
select tests.login_as('00000000-0000-0000-0000-00000000000c');
insert into public.reports (post_id, reason) values ('20000000-0000-0000-0000-000000000001', 'harassment');
select is((select count(*)::int from public.reports), 1, 'C ne voit que ses propres signalements');
select tests.logout();
select tests.login_as('00000000-0000-0000-0000-00000000000e');
insert into public.reports (post_id, reason) values ('20000000-0000-0000-0000-000000000001', 'other');
select is((select count(*)::int from public.community_posts), 0, '3 signalements : publication masquée pour les autres');
select tests.logout();
select tests.login_as('00000000-0000-0000-0000-00000000000a');
select is((select count(*)::int from public.community_posts), 1, 'l''auteur voit encore sa publication masquée');
select tests.logout();

select * from finish();
rollback;
