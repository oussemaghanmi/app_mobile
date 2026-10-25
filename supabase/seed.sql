-- Données de démonstration (à exécuter dans le SQL Editor de Supabase).
-- 1. Créer 3 comptes via Authentication > Users (patient, médecin, infirmier).
-- 2. Remplacer les UUID ci-dessous, puis exécuter.

-- update public.profiles set role = 'doctor' where id = '<UUID_MEDECIN>';
-- update public.profiles set role = 'nurse'  where id = '<UUID_INFIRMIER>';
-- insert into public.care_assignments values ('<UUID_PATIENT>', '<UUID_MEDECIN>');
-- insert into public.care_assignments values ('<UUID_PATIENT>', '<UUID_INFIRMIER>');

insert into public.tips (category, fr, en, ar, tn) values
('hydratation', 'Buvez de l''eau régulièrement, surtout en période de poussée.',
 'Drink water regularly, especially during a flare.',
 'اشرب الماء بانتظام، خاصة أثناء النوبة.',
 'اشرب الماء ديما، خاصة كي تكون في كريز.'),
('tabac', 'Arrêter le tabac réduit le risque de poussées de la maladie de Crohn.',
 'Quitting smoking lowers the risk of Crohn''s flares.',
 'الإقلاع عن التدخين يقلل من خطر نوبات داء كرون.',
 'كي تحبس الدخان، يقل الخطر متاع الكريزات.');
