begin;
create extension if not exists pgtap with schema extensions;
select plan(3);

insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-00000000000a', 'a@test.local', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000d1', 'd@test.local', 'authenticated', 'authenticated');
update public.profiles set role = 'doctor' where id = '00000000-0000-0000-0000-0000000000d1';
insert into public.prescriptions (id, patient_id, prescribed_by, medication, dosage, times_of_day)
values ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000a',
        '00000000-0000-0000-0000-0000000000d1', 'Med', '1 cp', '{08:00}');
-- passée prise, passée oubliée, future cochée en avance, future en attente (ignorée)
insert into public.medication_intakes (prescription_id, patient_id, scheduled_at, status) values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000a', now() - interval '2 hours', 'taken'),
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000a', now() - interval '1 hour', 'pending'),
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000a', now() + interval '1 minute', 'taken'),
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000a', now() + interval '2 minutes', 'pending');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
set local role authenticated;
select is(public.monthly_adherence(), 66.7::numeric, 'prise cochée en avance comptée, prise future en attente ignorée');
reset role;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000d1","role":"authenticated"}', true);
set local role authenticated;
select is(public.monthly_adherence(), 0::numeric, 'un autre utilisateur obtient sa propre observance (0)');
reset role;

set local role anon;
select is(public.monthly_adherence(), 0::numeric, 'anonyme : 0');
reset role;

select * from finish();
rollback;
