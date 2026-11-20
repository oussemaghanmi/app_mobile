-- Contenu éducatif, fonctions métier, suppression de compte.
begin;
select no_plan();
select tests.seed_fixtures();

-- Conseils : lecture pour tout connecté, écriture pour personne.
select tests.login_as(tests.u('p1'));
select is((select count(*)::int from public.tips where category = 'test'), 1, 'un patient lit les conseils');
select throws_ok($$insert into public.tips (category, fr) values ('x', 'y')$$, '42501', null, 'un patient ne crée pas de conseil');
select tests.logout();
select tests.login_as(tests.u('d1'));
select is((select count(*)::int from public.tips where category = 'test'), 1, 'un médecin lit les conseils');
select throws_ok($$insert into public.tips (category, fr) values ('x', 'y')$$, '42501', null, 'un médecin ne crée pas de conseil');
select tests.logout();

-- Observance mensuelle : 3 prises sur 4 = 75 %, calculée uniquement pour l'appelant.
delete from public.medication_intakes where patient_id = tests.u('p1');
insert into public.medication_intakes (prescription_id, patient_id, scheduled_at, status, taken_at)
  select tests.u('rx1'), tests.u('p1'), date_trunc('month', now()) + (n || ' minutes')::interval,
         case when n <= 3 then 'taken'::public.intake_status else 'pending'::public.intake_status end,
         case when n <= 3 then now() end
  from generate_series(1, 4) n;
select tests.login_as(tests.u('p1'));
select is(public.monthly_adherence(), 75.0, 'observance de p1 : 75 %');
select tests.logout();
select tests.login_as(tests.u('p2'));
select is(public.monthly_adherence(), 0::numeric, 'observance de p2 : 0 (ne dépend pas des données de p1)');
select tests.logout();

-- Rôle courant
select tests.login_as(tests.u('d1'));
select is(public.my_role()::text, 'doctor', 'my_role() renvoie le rôle de l''appelant');
select tests.logout();

-- Suppression de compte : efface le patient et toutes ses données, pas celles des autres.
select tests.login_as(tests.u('p1'));
select lives_ok('select public.delete_my_account()', 'p1 supprime son compte');
select tests.logout();
select is((select count(*)::int from auth.users where id = tests.u('p1')), 0, 'le compte p1 est supprimé');
select is((select count(*)::int from public.profiles where id = tests.u('p1')), 0, 'le profil p1 est supprimé');
select is((select count(*)::int from public.private_journal where patient_id = tests.u('p1')), 0, 'le journal de p1 est supprimé');
select is((select count(*)::int from public.prescriptions where patient_id = tests.u('p1')), 0, 'les prescriptions de p1 sont supprimées');
select is((select count(*)::int from public.nursing_notes where patient_id = tests.u('p1')), 0, 'les observations sur p1 sont supprimées');
select is((select count(*)::int from public.private_journal where patient_id = tests.u('p2')), 1, 'les données de p2 sont intactes');
select is((select count(*)::int from auth.users where id = tests.u('d1')), 1, 'le compte du médecin est intact');

select * from finish();
rollback;
