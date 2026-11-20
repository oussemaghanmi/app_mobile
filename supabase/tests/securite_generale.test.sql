-- Garde-fous transversaux : valables pour toute table ou fonction ajoutée plus tard.
begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

-- Toute table de public a le RLS activé.
select is(
  (select coalesce(string_agg(c.relname, ', ' order by c.relname), '')
     from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity),
  '', 'toutes les tables de public ont le RLS activé');

-- Le visiteur non connecté (anon) n'a aucun droit sur les tables de public.
select is(
  (select coalesce(string_agg(c.relname, ', ' order by c.relname), '')
     from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind in ('r', 'v', 'm')
      and (has_table_privilege('anon', c.oid, 'select') or has_table_privilege('anon', c.oid, 'insert')
        or has_table_privilege('anon', c.oid, 'update') or has_table_privilege('anon', c.oid, 'delete'))),
  '', 'anon n''a aucun droit sur les tables de public');

-- Le visiteur non connecté ne peut exécuter aucune fonction de public.
select is(
  (select coalesce(string_agg(p.proname, ', ' order by p.proname), '')
     from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prokind = 'f' and has_function_privilege('anon', p.oid, 'execute')),
  '', 'anon ne peut exécuter aucune fonction de public');

-- Les policies ne s'appliquent qu'aux utilisateurs connectés.
select is(
  (select coalesce(string_agg(tablename || '.' || policyname, ', ' order by tablename, policyname), '')
     from pg_policies where schemaname = 'public' and not (roles <@ array['authenticated']::name[])),
  '', 'toutes les policies sont réservées au rôle authenticated');

-- Règle n°2 : private_journal n'est exposé par aucune vue ni fonction, et sa policy est celle du propriétaire.
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
  'la policy de private_journal ne dépend que de patient_id = auth.uid()');

select * from finish();
rollback;
