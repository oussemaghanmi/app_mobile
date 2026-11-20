-- Prises médicamenteuses : génération depuis la prescription, droits par colonne, isolation.
begin;
select no_plan();
select tests.seed_fixtures();

-- ----- Génération (fuseau Africa/Tunis ; les horaires déjà passés ne sont jamais créés) -----
select is((select count(*)::int from public.medication_intakes where scheduled_at <= now()), 0,
  'aucune prise créée dans le passé (pas de « oubli » instantané)');
select is((select count(*)::int from public.medication_intakes
           where prescription_id = tests.u('rx1')
             and scheduled_at >= ((tests.today() + 1)::timestamp at time zone 'Africa/Tunis')), 26,
  '13 jours complets à venir x 2 horaires = 26 prises');
select is((select count(*)::int from public.medication_intakes
           where scheduled_at = ((tests.today() + 1) + time '08:00') at time zone 'Africa/Tunis'), 1,
  'la prise de demain 08:00 est exprimée en heure de Tunis');
select is((select count(*)::int from public.medication_intakes where patient_id <> tests.u('p1')), 0,
  'les prises appartiennent au patient de la prescription');
select is(public.generate_intakes(tests.u('rx1')), 0, 'generate_intakes est idempotente (rien de nouveau)');
select throws_ok($$insert into public.medication_intakes (prescription_id, patient_id, scheduled_at)
  values (tests.u('rx1'), tests.u('p1'), ((tests.today() + 1) + time '08:00') at time zone 'Africa/Tunis')$$,
  '23505', null, 'doublon (prescription, horaire) refusé');

-- Cas limites de génération
insert into public.prescriptions (id, patient_id, prescribed_by, medication, dosage, times_of_day, start_date, end_date)
  values ('00000000-0000-0000-0000-0000000000e2', tests.u('p1'), tests.u('d1'), 'cas-fin', 'dose-test',
          array['09:00']::time[], tests.today(), tests.today() + 1);
select is((select count(*)::int from public.medication_intakes
           where prescription_id = '00000000-0000-0000-0000-0000000000e2'
             and scheduled_at >= ((tests.today() + 2)::timestamp at time zone 'Africa/Tunis')), 0,
  'end_date respectée : aucune prise après la date de fin');
select is((select count(*)::int from public.medication_intakes
           where prescription_id = '00000000-0000-0000-0000-0000000000e2'
             and scheduled_at = ((tests.today() + 1) + time '09:00') at time zone 'Africa/Tunis'), 1,
  'end_date incluse : prise du dernier jour créée');
insert into public.prescriptions (id, patient_id, prescribed_by, medication, dosage, times_of_day, start_date)
  values ('00000000-0000-0000-0000-0000000000e3', tests.u('p1'), tests.u('d1'), 'cas-rétro', 'dose-test',
          array['10:00']::time[], tests.today() - 5);
select is((select count(*)::int from public.medication_intakes
           where prescription_id = '00000000-0000-0000-0000-0000000000e3'
             and scheduled_at < (tests.today()::timestamp at time zone 'Africa/Tunis')), 0,
  'start_date dans le passé : on ne fabrique pas de prises manquées');
insert into public.prescriptions (id, patient_id, prescribed_by, medication, dosage, times_of_day, active)
  values ('00000000-0000-0000-0000-0000000000e4', tests.u('p1'), tests.u('d1'), 'cas-inactif', 'dose-test',
          array['10:00']::time[], false);
select is((select count(*)::int from public.medication_intakes
           where prescription_id = '00000000-0000-0000-0000-0000000000e4'), 0, 'prescription inactive : aucune prise');

-- Modification des horaires : les prises prises restent, les prises futures en attente sont recalculées
update public.medication_intakes set status = 'taken', taken_at = now()
  where scheduled_at = ((tests.today() + 2) + time '08:00') at time zone 'Africa/Tunis';
update public.prescriptions set times_of_day = array['09:30']::time[] where id = tests.u('rx1');
select is((select count(*)::int from public.medication_intakes
           where prescription_id = tests.u('rx1') and status = 'taken'), 1, 'une prise déjà cochée est conservée');
select is((select count(*)::int from public.medication_intakes
           where prescription_id = tests.u('rx1') and status = 'pending' and scheduled_at > now()
             and ((scheduled_at at time zone 'Africa/Tunis')::time) in ('08:00', '20:00')), 0,
  'les anciennes prises futures en attente sont supprimées');
select is((select count(*)::int from public.medication_intakes
           where scheduled_at = ((tests.today() + 5) + time '09:30') at time zone 'Africa/Tunis'
             and prescription_id = tests.u('rx1')), 1, 'les nouvelles prises sont créées au nouvel horaire');
update public.prescriptions set active = false where id = tests.u('rx1');
select is((select count(*)::int from public.medication_intakes
           where prescription_id = tests.u('rx1') and status = 'pending' and scheduled_at > now()), 0,
  'prescription désactivée : plus aucune prise future en attente');
select is((select count(*)::int from public.medication_intakes
           where prescription_id = tests.u('rx1') and status = 'taken'), 1, 'la prise cochée reste dans l''historique');
update public.prescriptions set active = true, times_of_day = array['08:00', '20:00']::time[] where id = tests.u('rx1');

-- ----- Lecture -----
select tests.login_as(tests.u('p1'));
select cmp_ok((select count(*)::int from public.medication_intakes), '>=', 26, 'p1 voit ses prises');
select tests.logout();
select tests.login_as(tests.u('p2'));
select is((select count(*)::int from public.medication_intakes), 0, 'p2 ne voit aucune prise de p1');
select tests.logout();
select tests.login_as(tests.u('d1'));
select cmp_ok((select count(*)::int from public.medication_intakes), '>=', 26, 'd1 (affecté) voit les prises');
select tests.logout();
select tests.login_as(tests.u('n1'));
select cmp_ok((select count(*)::int from public.medication_intakes), '>=', 26, 'n1 (affectée) voit les prises');
select tests.logout();
select tests.login_as(tests.u('d2'));
select is((select count(*)::int from public.medication_intakes), 0, 'd2 (non affecté) ne voit aucune prise');
select tests.logout();

-- ----- Écriture par le patient : uniquement status et taken_at -----
create temp table _t as
  select (select id from public.medication_intakes
          where scheduled_at = ((tests.today() + 3) + time '08:00') at time zone 'Africa/Tunis') as a,
         (select id from public.medication_intakes
          where scheduled_at = ((tests.today() + 3) + time '20:00') at time zone 'Africa/Tunis') as b;
grant select on _t to authenticated;

select tests.login_as(tests.u('p1'));
select lives_ok($$update public.medication_intakes set status = 'taken', taken_at = now() where id = (select a from _t)$$,
  'p1 peut cocher une prise');
select lives_ok($$update public.medication_intakes set status = 'skipped' where id = (select b from _t)$$,
  'p1 peut marquer une prise comme sautée');
select throws_ok($$update public.medication_intakes set scheduled_at = now() where id = (select a from _t)$$,
  '42501', null, 'p1 ne peut PAS décaler une prise (scheduled_at)');
select throws_ok($$update public.medication_intakes set prescription_id = tests.u('rx1') where id = (select a from _t)$$,
  '42501', null, 'p1 ne peut PAS rattacher une prise à une autre prescription');
select throws_ok($$update public.medication_intakes set patient_id = tests.u('p2') where id = (select a from _t)$$,
  '42501', null, 'p1 ne peut PAS changer le patient d''une prise');
select throws_ok($$update public.medication_intakes set status = 'taken' where id = (select b from _t)$$,
  '23514', null, 'status « taken » sans taken_at est refusé');
select throws_ok($$insert into public.medication_intakes (prescription_id, patient_id, scheduled_at)
  values (tests.u('rx1'), tests.u('p1'), now() + interval '90 days')$$,
  '42501', null, 'p1 ne peut pas créer de prise lui-même');
with d as (delete from public.medication_intakes returning 1)
select is((select count(*)::int from d), 0, 'p1 ne peut pas supprimer de prises');
select throws_ok($$select public.generate_intakes(tests.u('rx1'))$$, '42501', null,
  'p1 ne peut pas appeler generate_intakes directement');
select is(public.refresh_my_intakes(), 0, 'refresh_my_intakes : rien à ajouter quand tout existe');
select tests.logout();

-- ----- Soignants et tiers n'écrivent pas -----
select tests.login_as(tests.u('d1'));
with u as (update public.medication_intakes set status = 'taken', taken_at = now() returning 1)
select is((select count(*)::int from u), 0, 'd1 ne peut pas cocher les prises du patient');
select tests.logout();
select tests.login_as(tests.u('n1'));
with u as (update public.medication_intakes set status = 'skipped' returning 1)
select is((select count(*)::int from u), 0, 'n1 ne peut pas modifier les prises');
select tests.logout();
select tests.login_as(tests.u('p2'));
with u as (update public.medication_intakes set status = 'skipped' returning 1)
select is((select count(*)::int from u), 0, 'p2 ne peut pas modifier les prises de p1');
select tests.logout();

-- ----- Réapprovisionnement : seul le patient concerné, seulement pour lui -----
delete from public.medication_intakes where prescription_id = tests.u('rx1');
select tests.login_as(tests.u('p2'));
select is(public.refresh_my_intakes(), 0, 'p2 : refresh_my_intakes ne crée rien pour la prescription de p1');
select tests.logout();
select is((select count(*)::int from public.medication_intakes where prescription_id = tests.u('rx1')), 0,
  'les prises de p1 n''ont pas été recréées par p2');
select tests.login_as(tests.u('p1'));
select cmp_ok(public.refresh_my_intakes(), '>=', 26, 'p1 : refresh_my_intakes recrée les prises manquantes');
select tests.logout();

select * from finish();
rollback;
