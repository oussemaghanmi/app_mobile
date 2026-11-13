begin;
create extension if not exists pgtap with schema extensions;
select plan(5);

insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-00000000000a', 'a@test.local', 'authenticated', 'authenticated');

select has_column('public', 'symptom_logs', 'on_period', 'symptom_logs.on_period existe');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
set local role authenticated;
select lives_ok($$ insert into public.symptom_logs (patient_id, pain_level, stools_per_day, on_period)
                   values ('00000000-0000-0000-0000-00000000000a', 3, 4, true) $$, 'le patient note un jour de règles');
select throws_ok($$ insert into public.symptom_logs (patient_id, pain_level) values ('00000000-0000-0000-0000-00000000000a', 11) $$,
  '23514', null, 'douleur bornée à 10');
select throws_ok($$ insert into public.private_journal (patient_id, content) values ('00000000-0000-0000-0000-00000000000a', '   ') $$,
  '23514', null, 'entrée privée vide refusée');
select lives_ok($$ delete from public.private_journal where patient_id = '00000000-0000-0000-0000-00000000000a' $$,
  'le patient peut supprimer son journal privé');
reset role;

select * from finish();
rollback;
