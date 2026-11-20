-- Règle n°2 : private_journal n'est lisible QUE par son patient. Aucune exception.
begin;
select no_plan();
select tests.seed_fixtures();

-- Garde-fous structurels : aucune vue, fonction ou policy supplémentaire n'expose le journal.
select is((select count(*)::int from pg_views where schemaname = 'public' and definition ilike '%private_journal%'),
  0, 'aucune vue ne référence private_journal');
select is((select count(*)::int from pg_matviews where schemaname = 'public' and definition ilike '%private_journal%'),
  0, 'aucune vue matérialisée ne référence private_journal');
select is((select count(*)::int from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.prosrc ilike '%private_journal%'),
  0, 'aucune fonction ne référence private_journal');
select is((select count(*)::int from pg_policies where schemaname = 'public' and tablename = 'private_journal'),
  1, 'private_journal a une seule policy');
select ok((select qual from pg_policies where schemaname = 'public' and tablename = 'private_journal') ~ 'patient_id = auth.uid\(\)'
  and (select qual from pg_policies where schemaname = 'public' and tablename = 'private_journal') !~* 'is_assigned_to|my_role',
  'la policy ne dépend que de patient_id = auth.uid()');
select ok((select relrowsecurity from pg_class where oid = 'public.private_journal'::regclass), 'RLS actif sur private_journal');
select is((select count(*)::int from pg_policies where schemaname = 'public' and tablename = 'private_journal'
           and 'authenticated' = any(roles)), 1, 'la policy ne concerne que le rôle authenticated');

-- Propriétaire
select tests.login_as(tests.u('p1'));
select is((select count(*)::int from public.private_journal), 1, 'p1 voit uniquement son journal');
select is((select content from public.private_journal), 'journal p1', 'p1 lit sa propre entrée');
select lives_ok($$insert into public.private_journal (patient_id, content) values (tests.u('p1'), 'deuxième')$$,
  'p1 peut écrire dans son journal');
select throws_ok($$insert into public.private_journal (patient_id, content) values (tests.u('p2'), 'intrusion')$$,
  '42501', null, 'p1 ne peut pas écrire dans le journal de p2');
select tests.logout();

-- Patient tiers
select tests.login_as(tests.u('p2'));
select is((select count(*)::int from public.private_journal where patient_id = tests.u('p1')), 0, 'p2 ne voit pas le journal de p1');
with u as (update public.private_journal set content = 'piraté' where patient_id = tests.u('p1') returning 1)
select is((select count(*)::int from u), 0, 'p2 ne peut pas modifier le journal de p1');
with d as (delete from public.private_journal where patient_id = tests.u('p1') returning 1)
select is((select count(*)::int from d), 0, 'p2 ne peut pas supprimer le journal de p1');
select tests.logout();

-- Soignants (affectés ou non)
select tests.login_as(tests.u('d1'));
select is((select count(*)::int from public.private_journal), 0, 'le médecin affecté ne voit AUCUN journal privé');
select throws_ok($$insert into public.private_journal (patient_id, content) values (tests.u('p1'), 'x')$$,
  '42501', null, 'le médecin ne peut pas écrire dans un journal privé');
with u as (update public.private_journal set content = 'x' returning 1)
select is((select count(*)::int from u), 0, 'le médecin ne peut pas modifier un journal privé');
select tests.logout();
select tests.login_as(tests.u('d2'));
select is((select count(*)::int from public.private_journal), 0, 'le médecin non affecté ne voit aucun journal privé');
select tests.logout();
select tests.login_as(tests.u('n1'));
select is((select count(*)::int from public.private_journal), 0, 'l''infirmière affectée ne voit AUCUN journal privé');
with d as (delete from public.private_journal returning 1)
select is((select count(*)::int from d), 0, 'l''infirmière ne peut pas supprimer un journal privé');
select tests.logout();

select is((select count(*)::int from public.private_journal), 3, 'état final : 3 entrées (2 de départ + 1 ajoutée par p1), rien de supprimé');

select * from finish();
rollback;
