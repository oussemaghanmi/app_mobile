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
insert into public.prescriptions (id, patient_id, prescribed_by, medication, dosage, times_of_day) values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000000d1', 'Med', '1 cp', '{08:00}');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000e1","role":"authenticated"}', true);
set local role authenticated;
select is_empty($$ update public.prescriptions set dosage = '2 cp' returning id $$, 'infirmier : ne modifie pas une prescription');
reset role;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000d2","role":"authenticated"}', true);
set local role authenticated;
select is_empty($$ update public.prescriptions set active = false returning id $$, 'médecin non affecté : ne peut pas arrêter');
reset role;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000d1","role":"authenticated"}', true);
set local role authenticated;
select isnt_empty($$ update public.prescriptions set dosage = '2 cp', times_of_day = '{08:00,20:00}' returning id $$,
  'médecin affecté : modifie dosage et horaires');
select throws_ok($$ update public.prescriptions set patient_id = '00000000-0000-0000-0000-00000000000b' $$,
  '42501', null, 'médecin : ne peut pas réattribuer à un patient non affecté');
select isnt_empty($$ update public.prescriptions set active = false returning id $$, 'médecin affecté : arrête la prescription');
select is_empty($$ delete from public.prescriptions returning id $$, 'aucune suppression : on désactive');
reset role;

select * from finish();
rollback;
