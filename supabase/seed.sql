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

-- Magasins de DÉMONSTRATION (développement local uniquement) : noms génériques et coordonnées
-- de centres-villes. La liste réelle des magasins tunisiens est à fournir (docs/QUESTIONS.md).
insert into public.stores (name, city, address, kind, lat, lon) values
('Épicerie bio (démo)', 'Tunis', 'Centre-ville', 'organic', 36.8065, 10.1815),
('Supermarché (démo)', 'Tunis', 'Lafayette', 'supermarket', 36.8150, 10.1780),
('Rayon sans gluten (démo)', 'Ariana', 'Centre', 'gluten_free', 36.8625, 10.1956),
('Supermarché (démo)', 'Sfax', 'Centre-ville', 'supermarket', 34.7406, 10.7603),
('Épicerie bio (démo)', 'Sousse', 'Centre-ville', 'organic', 35.8256, 10.6360),
('Supermarché (démo)', 'Monastir', 'Centre-ville', 'supermarket', 35.7643, 10.8113),
('Supermarché (démo)', 'Nabeul', 'Centre-ville', 'supermarket', 36.4561, 10.7376),
('Épicerie bio (démo)', 'Bizerte', 'Centre-ville', 'organic', 37.2744, 9.8739);
