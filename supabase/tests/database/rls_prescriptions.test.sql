-- Prescriptions : lecture patient + soignants affectés ; écriture réservée au MÉDECIN affecté.
begin;
select no_plan();
select tests.seed_fixtures();

-- Patient p1
select tests.login_as(tests.u('p1'));
select is((select count(*)::int from public.prescriptions), 1, 'p1 voit sa prescription');
select throws_ok($$insert into public.prescriptions (patient_id, prescribed_by, medication, dosage, times_of_day)
  values (tests.u('p1'), tests.u('p1'), 'm', 'd', array['08:00']::time[])$$,
  '42501', null, 'p1 ne peut pas se prescrire un médicament');
with u as (update public.prescriptions set dosage = 'modifié' returning 1)
select is((select count(*)::int from u), 0, 'p1 ne peut pas modifier sa prescription');
with d as (delete from public.prescriptions returning 1)
select is((select count(*)::int from d), 0, 'p1 ne peut pas supprimer sa prescription');
select tests.logout();

-- Patient tiers
select tests.login_as(tests.u('p2'));
select is((select count(*)::int from public.prescriptions), 0, 'p2 ne voit pas la prescription de p1');
select tests.logout();

-- Infirmière affectée : lecture seule
select tests.login_as(tests.u('n1'));
select is((select count(*)::int from public.prescriptions), 1, 'n1 (affectée) peut lire la prescription');
select throws_ok($$insert into public.prescriptions (patient_id, prescribed_by, medication, dosage, times_of_day)
  values (tests.u('p1'), tests.u('n1'), 'm', 'd', array['08:00']::time[])$$,
  '42501', null, 'n1 ne peut pas prescrire');
with u as (update public.prescriptions set dosage = 'modifié' returning 1)
select is((select count(*)::int from u), 0, 'n1 ne peut pas modifier une prescription');
select tests.logout();

-- Médecin non affecté
select tests.login_as(tests.u('d2'));
select is((select count(*)::int from public.prescriptions), 0, 'd2 ne voit aucune prescription');
select throws_ok($$insert into public.prescriptions (patient_id, prescribed_by, medication, dosage, times_of_day)
  values (tests.u('p1'), tests.u('d2'), 'm', 'd', array['08:00']::time[])$$,
  '42501', null, 'd2 (non affecté) ne peut pas prescrire à p1');
with u as (update public.prescriptions set dosage = 'modifié' returning 1)
select is((select count(*)::int from u), 0, 'd2 ne peut pas modifier la prescription de p1');
select tests.logout();

-- Médecin affecté d1
select tests.login_as(tests.u('d1'));
select is((select count(*)::int from public.prescriptions), 1, 'd1 voit la prescription de son patient');
select lives_ok($$insert into public.prescriptions (patient_id, prescribed_by, medication, dosage, times_of_day)
  values (tests.u('p1'), tests.u('d1'), 'autre-test', 'dose-2', array['12:00']::time[])$$,
  'd1 peut prescrire à son patient');
select throws_ok($$insert into public.prescriptions (patient_id, prescribed_by, medication, dosage, times_of_day)
  values (tests.u('p1'), tests.u('d2'), 'm', 'd', array['08:00']::time[])$$,
  '42501', null, 'd1 ne peut pas prescrire au nom d''un autre médecin');
select throws_ok($$insert into public.prescriptions (patient_id, prescribed_by, medication, dosage, times_of_day)
  values (tests.u('p2'), tests.u('d1'), 'm', 'd', array['08:00']::time[])$$,
  '42501', null, 'd1 ne peut pas prescrire à un patient non affecté');
select lives_ok($$update public.prescriptions set dosage = 'dose-modifiée' where id = tests.u('rx1')$$,
  'd1 peut modifier la posologie de son patient');
select throws_ok($$update public.prescriptions set patient_id = tests.u('p2') where id = tests.u('rx1')$$,
  '42501', null, 'patient_id d''une prescription n''est pas modifiable');
select throws_ok($$update public.prescriptions set prescribed_by = tests.u('d2') where id = tests.u('rx1')$$,
  '42501', null, 'prescribed_by n''est pas modifiable');
select tests.logout();
select is((select dosage from public.prescriptions where id = tests.u('rx1')), 'dose-modifiée', 'la modification de d1 est enregistrée');

select * from finish();
rollback;
