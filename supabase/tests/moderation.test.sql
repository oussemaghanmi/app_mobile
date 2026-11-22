-- Modération de la communauté (0014) : lister les signalements, remettre en ligne, supprimer.
-- Fonctions réservées à service_role ; les personnes qui signalent restent anonymes.
begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

create schema if not exists tests;
create or replace function tests.create_user(p_id uuid, p_role public.app_role, p_name text)
returns void language plpgsql as $$
begin
  insert into auth.users (id, email, aud, role) values (p_id, p_name || '@test.local', 'authenticated', 'authenticated');
  update public.profiles set role = p_role, first_name = p_name, last_name = 'NomReel' where id = p_id;
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
create or replace function tests.report(p_reporter uuid, p_post uuid, p_comment uuid) returns void
language plpgsql as $$
begin
  perform tests.login_as(p_reporter);
  insert into public.reports (post_id, comment_id, reason) values (p_post, p_comment, 'spam');
  perform tests.logout();
end $$;
create or replace function tests.visible_post(p_viewer uuid, p_post uuid) returns int language plpgsql as $$
declare n int;
begin
  perform tests.login_as(p_viewer);
  select count(*) into n from public.community_posts where id = p_post;
  perform tests.logout();
  return n;
end $$;
create or replace function tests.visible_comment(p_viewer uuid, p_comment uuid) returns int language plpgsql as $$
declare n int;
begin
  perform tests.login_as(p_viewer);
  select count(*) into n from public.community_comments where id = p_comment;
  perform tests.logout();
  return n;
end $$;
grant usage on schema tests to anon, authenticated, service_role;
grant execute on all functions in schema tests to anon, authenticated, service_role;

-- Auteure (A), trois signalantes (R1-R3), une lectrice (V), un médecin (D)
select tests.create_user('00000000-0000-0000-0000-0000000005a1', 'patient', 'modA');
select tests.create_user('00000000-0000-0000-0000-0000000005b1', 'patient', 'modR1');
select tests.create_user('00000000-0000-0000-0000-0000000005b2', 'patient', 'modR2');
select tests.create_user('00000000-0000-0000-0000-0000000005b3', 'patient', 'modR3');
select tests.create_user('00000000-0000-0000-0000-0000000005c1', 'patient', 'modV');
select tests.create_user('00000000-0000-0000-0000-0000000005d1', 'doctor', 'modD');
insert into public.community_profiles (user_id, pseudonym) values
  ('00000000-0000-0000-0000-0000000005a1', 'Auteure'),
  ('00000000-0000-0000-0000-0000000005b1', 'Sig1'),
  ('00000000-0000-0000-0000-0000000005b2', 'Sig2'),
  ('00000000-0000-0000-0000-0000000005b3', 'Sig3'),
  ('00000000-0000-0000-0000-0000000005c1', 'Lectrice');
insert into public.community_posts (id, author_id, content) values
  ('50000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000005a1', 'publication signalée');
insert into public.community_comments (id, post_id, author_id, content) values
  ('51000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-0000000005a1', 'commentaire signalé');

-- ---------- Droits : patiente, médecin et anon refusés (42501) ----------
select tests.login_as('00000000-0000-0000-0000-0000000005c1');
select throws_ok($$select * from public.admin_list_reports()$$, '42501', null, 'patiente : admin_list_reports refusé');
select throws_ok($$select public.admin_restore_content('post', '50000000-0000-0000-0000-000000000001')$$, '42501', null,
  'patiente : admin_restore_content refusé');
select throws_ok($$select public.admin_remove_content('post', '50000000-0000-0000-0000-000000000001')$$, '42501', null,
  'patiente : admin_remove_content refusé');
select tests.logout();
select tests.login_as('00000000-0000-0000-0000-0000000005d1');
select throws_ok($$select * from public.admin_list_reports()$$, '42501', null, 'médecin : admin_list_reports refusé');
select throws_ok($$select public.admin_restore_content('post', '50000000-0000-0000-0000-000000000001')$$, '42501', null,
  'médecin : admin_restore_content refusé');
select throws_ok($$select public.admin_remove_content('post', '50000000-0000-0000-0000-000000000001')$$, '42501', null,
  'médecin : admin_remove_content refusé');
select tests.logout();
set local role anon;
select throws_ok($$select * from public.admin_list_reports()$$, '42501', null, 'anon : admin_list_reports refusé');
select throws_ok($$select public.admin_restore_content('post', '50000000-0000-0000-0000-000000000001')$$, '42501', null,
  'anon : admin_restore_content refusé');
select throws_ok($$select public.admin_remove_content('post', '50000000-0000-0000-0000-000000000001')$$, '42501', null,
  'anon : admin_remove_content refusé');
reset role;

-- Le résultat de admin_list_reports n'expose ni les signalantes ni l'identité réelle de l'auteure
select is(
  pg_get_function_result('public.admin_list_reports()'::regprocedure),
  'TABLE(kind text, content_id uuid, content text, hidden boolean, author_pseudonym text, reason text, report_count bigint, last_reported_at timestamp with time zone)',
  'signature exacte de admin_list_reports (aucune colonne reporter_id ni nom réel)');

-- ---------- Publication : 3 signalements → masquée → liste → restauration ----------
select tests.report('00000000-0000-0000-0000-0000000005b1', '50000000-0000-0000-0000-000000000001', null);
select tests.report('00000000-0000-0000-0000-0000000005b2', '50000000-0000-0000-0000-000000000001', null);
select tests.report('00000000-0000-0000-0000-0000000005b3', '50000000-0000-0000-0000-000000000001', null);
select is(tests.visible_post('00000000-0000-0000-0000-0000000005c1', '50000000-0000-0000-0000-000000000001'), 0,
  '3 signalements : la publication est masquée pour les autres');
select is(tests.visible_post('00000000-0000-0000-0000-0000000005a1', '50000000-0000-0000-0000-000000000001'), 1,
  'l''auteure la voit toujours');

set local role service_role;
select results_eq(
  $$select kind, content_id, hidden, author_pseudonym, reason, report_count from public.admin_list_reports()$$,
  $$values ('post'::text, '50000000-0000-0000-0000-000000000001'::uuid, true, 'Auteure'::text, 'spam'::text, 3::bigint)$$,
  'admin_list_reports : la publication, masquée, 3 signalements, pseudonyme de l''auteure');
select ok(
  (select bool_and(position('NomReel' in coalesce(content, '') || author_pseudonym) = 0) from public.admin_list_reports()),
  'admin_list_reports ne renvoie pas le nom réel de l''auteure');
select lives_ok($$select public.admin_restore_content('post', '50000000-0000-0000-0000-000000000001')$$,
  'admin_restore_content(post)');
reset role;

select is(tests.visible_post('00000000-0000-0000-0000-0000000005c1', '50000000-0000-0000-0000-000000000001'), 1,
  'restaurée : visible de nouveau pour les autres');
select is((select count(*)::int from public.reports where post_id = '50000000-0000-0000-0000-000000000001'), 0,
  'restaurée : ses signalements ont été supprimés');
select tests.report('00000000-0000-0000-0000-0000000005b1', '50000000-0000-0000-0000-000000000001', null);
select is(tests.visible_post('00000000-0000-0000-0000-0000000005c1', '50000000-0000-0000-0000-000000000001'), 1,
  'un nouveau signalement ne la remasque pas (compteur reparti de zéro)');

-- ---------- Commentaire : même parcours ----------
select tests.report('00000000-0000-0000-0000-0000000005b1', null, '51000000-0000-0000-0000-000000000001');
select tests.report('00000000-0000-0000-0000-0000000005b2', null, '51000000-0000-0000-0000-000000000001');
select tests.report('00000000-0000-0000-0000-0000000005b3', null, '51000000-0000-0000-0000-000000000001');
select is(tests.visible_comment('00000000-0000-0000-0000-0000000005c1', '51000000-0000-0000-0000-000000000001'), 0,
  '3 signalements : le commentaire est masqué pour les autres');

-- now() est figé dans la transaction : on vieillit le signalement de la publication pour tester l'ordre.
update public.reports set created_at = now() - interval '1 hour' where post_id = '50000000-0000-0000-0000-000000000001';

set local role service_role;
select results_eq(
  $$select kind, hidden, author_pseudonym, report_count from public.admin_list_reports()
     where content_id = '51000000-0000-0000-0000-000000000001'$$,
  $$values ('comment'::text, true, 'Auteure'::text, 3::bigint)$$,
  'admin_list_reports : le commentaire, masqué, 3 signalements');
select is((select kind from public.admin_list_reports() limit 1), 'comment',
  'le contenu signalé le plus récemment vient en premier');
select lives_ok($$select public.admin_restore_content('comment', '51000000-0000-0000-0000-000000000001')$$,
  'admin_restore_content(comment)');
reset role;
select is(tests.visible_comment('00000000-0000-0000-0000-0000000005c1', '51000000-0000-0000-0000-000000000001'), 1,
  'commentaire restauré : visible de nouveau');
select is((select count(*)::int from public.reports where comment_id = '51000000-0000-0000-0000-000000000001'), 0,
  'commentaire restauré : ses signalements ont été supprimés');

-- ---------- Erreurs explicites ----------
set local role service_role;
select throws_ok($$select public.admin_restore_content('autre', '50000000-0000-0000-0000-000000000001')$$, 'P0001', null,
  'restore : type inconnu refusé');
select throws_ok($$select public.admin_remove_content('autre', '50000000-0000-0000-0000-000000000001')$$, 'P0001', null,
  'remove : type inconnu refusé');
select throws_ok($$select public.admin_restore_content('post', '5fffffff-0000-0000-0000-000000000000')$$, 'P0001', null,
  'restore : publication inconnue refusée');
select throws_ok($$select public.admin_remove_content('comment', '5fffffff-0000-0000-0000-000000000000')$$, 'P0001', null,
  'remove : commentaire inconnu refusé');

-- ---------- Suppression ----------
select lives_ok($$select public.admin_remove_content('comment', '51000000-0000-0000-0000-000000000001')$$,
  'admin_remove_content(comment)');
select lives_ok($$select public.admin_remove_content('post', '50000000-0000-0000-0000-000000000001')$$,
  'admin_remove_content(post)');
reset role;
select is((select count(*)::int from public.community_comments where id = '51000000-0000-0000-0000-000000000001'), 0,
  'le commentaire est supprimé');
select is((select count(*)::int from public.community_posts where id = '50000000-0000-0000-0000-000000000001'), 0,
  'la publication est supprimée');
select is((select count(*)::int from public.reports where post_id = '50000000-0000-0000-0000-000000000001'), 0,
  'ses signalements sont partis avec elle');

select * from finish();
rollback;
