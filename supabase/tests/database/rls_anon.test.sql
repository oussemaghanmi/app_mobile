-- Un visiteur non connecté (rôle anon) n'a accès à rien.
begin;
select no_plan();
select tests.seed_fixtures();
select tests.login_anon();

select throws_ok('select 1 from public.profiles', '42501', null, 'anon : lecture profiles refusée');
select throws_ok('select 1 from public.care_assignments', '42501', null, 'anon : lecture care_assignments refusée');
select throws_ok('select 1 from public.prescriptions', '42501', null, 'anon : lecture prescriptions refusée');
select throws_ok('select 1 from public.medication_intakes', '42501', null, 'anon : lecture medication_intakes refusée');
select throws_ok('select 1 from public.mood_logs', '42501', null, 'anon : lecture mood_logs refusée');
select throws_ok('select 1 from public.symptom_logs', '42501', null, 'anon : lecture symptom_logs refusée');
select throws_ok('select 1 from public.private_journal', '42501', null, 'anon : lecture private_journal refusée');
select throws_ok('select 1 from public.nursing_notes', '42501', null, 'anon : lecture nursing_notes refusée');
select throws_ok('select 1 from public.tips', '42501', null, 'anon : lecture tips refusée');

select throws_ok($$insert into public.private_journal (patient_id, content) values (tests.u('p1'), 'x')$$,
  '42501', null, 'anon : écriture private_journal refusée');
select throws_ok($$insert into public.mood_logs (patient_id, mood) values (tests.u('p2'), 3)$$,
  '42501', null, 'anon : écriture mood_logs refusée');

select throws_ok('select public.my_role()', '42501', null, 'anon : my_role() non exécutable');
select throws_ok($$select public.is_assigned_to(tests.u('p1'))$$, '42501', null, 'anon : is_assigned_to() non exécutable');
select throws_ok('select public.monthly_adherence()', '42501', null, 'anon : monthly_adherence() non exécutable');
select throws_ok('select public.delete_my_account()', '42501', null, 'anon : delete_my_account() non exécutable');
select throws_ok('select public.refresh_my_intakes()', '42501', null, 'anon : refresh_my_intakes() non exécutable');

select * from finish();
rollback;
