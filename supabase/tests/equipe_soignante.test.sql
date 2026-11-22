begin;
create extension if not exists pgtap with schema extensions;
select plan(6);

insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-00000000000a', 'a@t.l', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-00000000000b', 'b@t.l', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000d1', 'd1@t.l', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000d2', 'd2@t.l', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000e1', 'e1@t.l', 'authenticated', 'authenticated');
update public.profiles set role = 'doctor' where id in ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000d2');
update public.profiles set role = 'nurse' where id = '00000000-0000-0000-0000-0000000000e1';
insert into public.care_assignments values
  ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000000d1'),
  ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000000e1'),
  ('00000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-0000000000d2');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
set local role authenticated;
select is((select count(*)::int from public.profiles), 3, 'patient A : soi + son médecin + son infirmier');
select ok(not exists (select 1 from public.profiles where id = '00000000-0000-0000-0000-0000000000d2'),
  'patient A : ne voit pas un médecin non affecté');
select ok(not exists (select 1 from public.profiles where id = '00000000-0000-0000-0000-00000000000b'),
  'patient A : ne voit toujours pas les autres patients');
reset role;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000d1","role":"authenticated"}', true);
set local role authenticated;
select ok(exists (select 1 from public.profiles where id = '00000000-0000-0000-0000-0000000000e1'),
  'médecin : voit l''infirmier du même patient');
select ok(not exists (select 1 from public.profiles where id = '00000000-0000-0000-0000-0000000000d2'),
  'médecin : ne voit pas un confrère sans patient commun');
reset role;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000e1","role":"authenticated"}', true);
set local role authenticated;
select ok(not exists (select 1 from public.private_journal), 'infirmier : journal privé toujours invisible');
reset role;

select * from finish();
rollback;
