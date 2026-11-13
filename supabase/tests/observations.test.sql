begin;
create extension if not exists pgtap with schema extensions;
select plan(7);

insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-00000000000a', 'a@t.l', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-00000000000b', 'b@t.l', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000d1', 'd1@t.l', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000e1', 'e1@t.l', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000e2', 'e2@t.l', 'authenticated', 'authenticated');
update public.profiles set role = 'doctor' where id = '00000000-0000-0000-0000-0000000000d1';
update public.profiles set role = 'nurse' where id in ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000e2');
insert into public.care_assignments values
  ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000000d1'),
  ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000000e1');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000e1","role":"authenticated"}', true);
set local role authenticated;
select lives_ok($$ insert into public.nursing_notes (patient_id, nurse_id, content)
                   values ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000000e1', 'Pansement refait') $$,
  'infirmier affecté : rédige une observation');
select throws_ok($$ insert into public.nursing_notes (patient_id, nurse_id, content)
                    values ('00000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-0000000000e1', 'x') $$,
  '42501', null, 'infirmier : pas d''observation pour un patient non affecté');
select throws_ok($$ insert into public.nursing_notes (patient_id, nurse_id, content)
                    values ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000000e2', 'x') $$,
  '42501', null, 'infirmier : ne signe pas au nom d''un collègue');
select is_empty($$ update public.nursing_notes set content = 'modifié' returning id $$,
  'observation non modifiable (traçabilité)');
reset role;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000d1","role":"authenticated"}', true);
set local role authenticated;
select throws_ok($$ insert into public.nursing_notes (patient_id, nurse_id, content)
                    values ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000000d1', 'x') $$,
  '42501', null, 'médecin : ne rédige pas d''observation infirmière');
select is((select count(*)::int from public.nursing_notes), 1, 'médecin affecté : lit les observations');
reset role;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
set local role authenticated;
select is((select count(*)::int from public.nursing_notes), 1, 'patient : lit les observations le concernant');
reset role;

select * from finish();
rollback;
