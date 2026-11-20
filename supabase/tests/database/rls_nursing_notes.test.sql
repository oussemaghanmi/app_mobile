-- Observations infirmières : rédigées, modifiées et supprimées par l'infirmier AFFECTÉ qui en est l'auteur.
begin;
select no_plan();
select tests.seed_fixtures();

-- Lecture
select tests.login_as(tests.u('p1'));
select is((select count(*)::int from public.nursing_notes), 1, 'p1 lit les observations qui le concernent');
select throws_ok($$insert into public.nursing_notes (patient_id, nurse_id, content) values (tests.u('p1'), tests.u('p1'), 'x')$$,
  '42501', null, 'p1 ne peut pas rédiger d''observation');
with u as (update public.nursing_notes set content = 'effacé' returning 1)
select is((select count(*)::int from u), 0, 'p1 ne peut pas modifier une observation');
with d as (delete from public.nursing_notes returning 1)
select is((select count(*)::int from d), 0, 'p1 ne peut pas supprimer une observation');
select tests.logout();
select tests.login_as(tests.u('p2'));
select is((select count(*)::int from public.nursing_notes), 0, 'p2 ne voit pas les observations de p1');
select tests.logout();
select tests.login_as(tests.u('d2'));
select is((select count(*)::int from public.nursing_notes), 0, 'd2 (non affecté) ne voit rien');
select tests.logout();
select tests.login_as(tests.u('d1'));
select is((select count(*)::int from public.nursing_notes), 1, 'd1 (affecté) lit les observations');
select throws_ok($$insert into public.nursing_notes (patient_id, nurse_id, content) values (tests.u('p1'), tests.u('d1'), 'x')$$,
  '42501', null, 'un médecin ne rédige pas d''observation infirmière');
with u as (update public.nursing_notes set content = 'altéré' returning 1)
select is((select count(*)::int from u), 0, 'd1 ne peut pas modifier une observation');
with d as (delete from public.nursing_notes returning 1)
select is((select count(*)::int from d), 0, 'd1 ne peut pas supprimer une observation');
select tests.logout();

-- Écriture par l'infirmière affectée n1
select tests.login_as(tests.u('n1'));
select lives_ok($$insert into public.nursing_notes (patient_id, nurse_id, content) values (tests.u('p1'), tests.u('n1'), 'deuxième')$$,
  'n1 rédige une observation pour sa patiente');
select throws_ok($$insert into public.nursing_notes (patient_id, nurse_id, content) values (tests.u('p2'), tests.u('n1'), 'x')$$,
  '42501', null, 'n1 ne peut pas écrire pour un patient non affecté');
select throws_ok($$insert into public.nursing_notes (patient_id, nurse_id, content) values (tests.u('p1'), tests.u('n2'), 'x')$$,
  '42501', null, 'n1 ne peut pas écrire au nom d''une autre infirmière');
select lives_ok($$update public.nursing_notes set content = 'corrigée' where content = 'deuxième'$$, 'n1 corrige sa propre observation');
select throws_ok($$update public.nursing_notes set patient_id = tests.u('p2') where content = 'corrigée'$$,
  '42501', null, 'patient_id d''une observation n''est pas modifiable');
select throws_ok($$update public.nursing_notes set nurse_id = tests.u('n2') where content = 'corrigée'$$,
  '42501', null, 'nurse_id d''une observation n''est pas modifiable');
select lives_ok($$delete from public.nursing_notes where content = 'corrigée'$$, 'n1 supprime sa propre observation');
select tests.logout();

-- Une autre infirmière, même affectée, ne touche pas aux observations d'autrui
insert into public.care_assignments (patient_id, professional_id) values (tests.u('p1'), tests.u('n2'));
select tests.login_as(tests.u('n2'));
select is((select count(*)::int from public.nursing_notes), 1, 'n2 (désormais affectée) lit l''observation de n1');
with u as (update public.nursing_notes set content = 'détourné' returning 1)
select is((select count(*)::int from u), 0, 'n2 ne peut pas modifier l''observation de n1');
with d as (delete from public.nursing_notes returning 1)
select is((select count(*)::int from d), 0, 'n2 ne peut pas supprimer l''observation de n1');
select tests.logout();
select is((select content from public.nursing_notes), 'observation n1', 'l''observation de n1 est intacte');

select * from finish();
rollback;
