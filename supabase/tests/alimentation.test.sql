begin;
create extension if not exists pgtap with schema extensions;
select plan(7);

insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-00000000000a', 'a@test.local', 'authenticated', 'authenticated');
insert into public.stores (name, city, lat, lon) values ('Test', 'Tunis', 36.8, 10.18);

select ok((select count(*) from public.recipes) >= 6, 'recettes de base présentes');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
set local role authenticated;
select ok((select count(*) from public.recipes) >= 6, 'connecté : lit les recettes');
select ok(exists (select 1 from public.stores where name = 'Test'), 'connecté : lit les magasins');
select throws_ok($$ insert into public.stores (name, city, lat, lon) values ('X', 'Sfax', 34.7, 10.7) $$,
  '42501', null, 'connecté : ne peut pas ajouter de magasin');
select is_empty($$ update public.recipes set title_fr = 'piraté' returning id $$,
  'connecté : ne peut pas modifier une recette');
reset role;

set local role anon;
select throws_ok('select 1 from public.recipes', '42501', null, 'anonyme : lecture des recettes refusée');
select throws_ok('select 1 from public.stores', '42501', null, 'anonyme : lecture des magasins refusée');
reset role;

select * from finish();
rollback;
