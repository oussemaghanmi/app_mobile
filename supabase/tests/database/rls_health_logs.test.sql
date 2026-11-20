-- Humeur et symptômes : le patient écrit, les soignants AFFECTÉS lisent seulement.
begin;
select no_plan();
select tests.seed_fixtures();

-- Patient p1
select tests.login_as(tests.u('p1'));
select is((select count(*)::int from public.symptom_logs), 1, 'p1 voit son symptôme');
select is((select count(*)::int from public.mood_logs), 1, 'p1 voit son humeur');
select lives_ok($$insert into public.symptom_logs (patient_id, pain_level, notes) values (tests.u('p1'), 5, 'nouveau')$$,
  'p1 peut enregistrer un symptôme');
select lives_ok($$update public.symptom_logs set notes = 'corrigé' where notes = 'nouveau'$$, 'p1 peut corriger son symptôme');
select lives_ok($$delete from public.symptom_logs where notes = 'corrigé'$$, 'p1 peut supprimer son symptôme');
select lives_ok($$update public.mood_logs set mood = 2 where day = current_date$$, 'p1 peut changer son humeur du jour');
select throws_ok($$insert into public.symptom_logs (patient_id, pain_level) values (tests.u('p2'), 5)$$,
  '42501', null, 'p1 ne peut pas écrire un symptôme pour p2');
select throws_ok($$insert into public.mood_logs (patient_id, mood) values (tests.u('p2'), 5)$$,
  '42501', null, 'p1 ne peut pas écrire une humeur pour p2');
select throws_ok($$insert into public.symptom_logs (patient_id, pain_level) values (tests.u('p1'), 11)$$,
  '23514', null, 'douleur hors de 0..10 refusée');
select throws_ok($$insert into public.mood_logs (patient_id, day, mood) values (tests.u('p1'), current_date - 1, 6)$$,
  '23514', null, 'humeur hors de 1..5 refusée');
select tests.logout();

-- Patient tiers
select tests.login_as(tests.u('p2'));
select is((select count(*)::int from public.symptom_logs), 0, 'p2 ne voit pas les symptômes de p1');
select is((select count(*)::int from public.mood_logs), 0, 'p2 ne voit pas l''humeur de p1');
with u as (update public.symptom_logs set notes = 'piraté' returning 1)
select is((select count(*)::int from u), 0, 'p2 ne peut pas modifier les symptômes de p1');
select tests.logout();

-- Soignants affectés : lecture seule
select tests.login_as(tests.u('d1'));
select is((select count(*)::int from public.symptom_logs), 1, 'd1 lit les symptômes de son patient');
select is((select count(*)::int from public.mood_logs), 1, 'd1 lit l''humeur de son patient');
select throws_ok($$insert into public.symptom_logs (patient_id, pain_level) values (tests.u('p1'), 1)$$,
  '42501', null, 'd1 ne peut pas écrire de symptôme');
with u as (update public.symptom_logs set notes = 'altéré' returning 1)
select is((select count(*)::int from u), 0, 'd1 ne peut pas modifier un symptôme');
with d as (delete from public.mood_logs returning 1)
select is((select count(*)::int from d), 0, 'd1 ne peut pas supprimer une humeur');
select tests.logout();
select tests.login_as(tests.u('n1'));
select is((select count(*)::int from public.symptom_logs), 1, 'n1 lit les symptômes de sa patiente');
select tests.logout();

-- Soignants non affectés
select tests.login_as(tests.u('d2'));
select is((select count(*)::int from public.symptom_logs), 0, 'd2 (non affecté) ne voit aucun symptôme');
select is((select count(*)::int from public.mood_logs), 0, 'd2 ne voit aucune humeur');
select tests.logout();
select tests.login_as(tests.u('n2'));
select is((select count(*)::int from public.symptom_logs), 0, 'n2 (non affectée) ne voit aucun symptôme');
select tests.logout();

select * from finish();
rollback;
