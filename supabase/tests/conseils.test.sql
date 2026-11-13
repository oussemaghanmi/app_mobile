begin;
create extension if not exists pgtap with schema extensions;
select plan(4);

insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-00000000000a', 'a@test.local', 'authenticated', 'authenticated');

select ok((select count(*) from public.tips) >= 8, 'conseils de base présents');
select throws_ok($$ insert into public.tips (category, fr) values ('inconnue', 'x') $$,
  '23514', null, 'catégorie inconnue refusée');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
set local role authenticated;
select ok((select count(*) from public.tips) >= 8, 'connecté : lit les conseils');
reset role;

set local role anon;
select is((select count(*)::int from public.tips), 0, 'anonyme : aucun conseil');
reset role;

select * from finish();
rollback;
