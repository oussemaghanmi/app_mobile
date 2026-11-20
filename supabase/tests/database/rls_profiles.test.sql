-- Profils et affectations : qui voit quoi, et personne ne peut changer son propre rôle.
begin;
select no_plan();
select tests.seed_fixtures();

-- Création de compte : le rôle ne vient jamais des métadonnées d'inscription.
insert into auth.users (id, email, raw_user_meta_data)
  values (tests.u('p3'), 'p3@test.local', '{"first_name":"Sana","role":"doctor"}');
select is((select role::text from public.profiles where id = tests.u('p3')), 'patient',
  'inscription : le rôle demandé dans les métadonnées est ignoré (toujours patient)');
select is((select first_name from public.profiles where id = tests.u('p3')), 'Sana',
  'inscription : le prénom est copié');

-- Patient p1
select tests.login_as(tests.u('p1'));
select is((select count(*)::int from public.profiles), 1, 'p1 ne voit que son propre profil');
select is((select count(*)::int from public.profiles where id = tests.u('p2')), 0, 'p1 ne voit pas p2');
select lives_ok($$update public.profiles set first_name = 'Nouveau' where id = tests.u('p1')$$,
  'p1 peut modifier son prénom');
select throws_ok($$update public.profiles set role = 'doctor' where id = tests.u('p1')$$,
  '42501', null, 'p1 ne peut PAS se promouvoir médecin');
select throws_ok($$update public.profiles set role = 'nurse' where id = tests.u('p1')$$,
  '42501', null, 'p1 ne peut PAS se promouvoir infirmier');
update public.profiles set first_name = 'Pirate' where id = tests.u('p2');
select throws_ok($$insert into public.profiles (id) values (gen_random_uuid())$$,
  '42501', null, 'p1 ne peut pas créer de profil');
select throws_ok($$insert into public.care_assignments (patient_id, professional_id) values (tests.u('p1'), tests.u('p1'))$$,
  '42501', null, 'p1 ne peut pas s''affecter lui-même');
select is((select count(*)::int from public.care_assignments), 2, 'p1 voit ses 2 affectations');
select tests.logout();
select is((select first_name from public.profiles where id = tests.u('p2')), '',
  'la modification du profil de p2 par p1 n''a eu aucun effet');

-- Médecin affecté d1
select tests.login_as(tests.u('d1'));
select is((select count(*)::int from public.profiles where id = tests.u('p1')), 1, 'd1 voit son patient affecté p1');
select is((select count(*)::int from public.profiles where id = tests.u('p2')), 0, 'd1 ne voit pas p2');
select is((select count(*)::int from public.care_assignments), 1, 'd1 voit sa propre affectation');
with u as (update public.profiles set first_name = 'Pirate' where id = tests.u('p1') returning 1)
select is((select count(*)::int from u), 0, 'd1 ne peut pas modifier le profil de p1');
select throws_ok($$insert into public.care_assignments (patient_id, professional_id) values (tests.u('p2'), tests.u('d1'))$$,
  '42501', null, 'd1 ne peut pas s''affecter un patient');
select tests.logout();

-- Médecin non affecté d2 et infirmière non affectée n2
select tests.login_as(tests.u('d2'));
select is((select count(*)::int from public.profiles), 1, 'd2 ne voit que lui-même');
select is((select count(*)::int from public.care_assignments), 0, 'd2 ne voit aucune affectation');
select tests.logout();
select tests.login_as(tests.u('n2'));
select is((select count(*)::int from public.profiles where id = tests.u('p1')), 0, 'n2 ne voit pas p1');
select tests.logout();

-- Un « soignant » dont le profil est resté patient ne devient pas soignant par une affectation.
insert into public.care_assignments (patient_id, professional_id) values (tests.u('p2'), tests.u('p1'));
select tests.login_as(tests.u('p1'));
select is((select count(*)::int from public.profiles where id = tests.u('p2')), 0,
  'une affectation vers un compte patient ne donne aucun accès');
select is(public.is_assigned_to(tests.u('p2')), false, 'is_assigned_to exige un rôle soignant');
select tests.logout();

select * from finish();
rollback;
