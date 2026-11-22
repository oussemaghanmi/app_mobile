-- =============================================================
-- 0004 — Alimentation : recettes et magasins
-- Contenu de référence lisible par tout utilisateur connecté ;
-- écriture réservée à l'administration (service_role), aucune policy d'écriture.
-- =============================================================

create type public.recipe_phase as enum ('flare', 'remission', 'all');

create table public.recipes (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  phase           public.recipe_phase not null default 'all',
  prep_minutes    smallint check (prep_minutes > 0),
  emoji           text not null default '🍲',
  image_url       text,
  title_fr text not null, title_en text not null, title_ar text not null, title_tn text not null,
  summary_fr text not null, summary_en text not null, summary_ar text not null, summary_tn text not null,
  -- ingrédients et étapes : une ligne par élément
  ingredients_fr text not null, ingredients_en text not null, ingredients_ar text not null, ingredients_tn text not null,
  steps_fr text not null, steps_en text not null, steps_ar text not null, steps_tn text not null,
  created_at      timestamptz not null default now()
);

create table public.stores (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  city       text not null,
  address    text,
  kind       text not null default 'supermarket' check (kind in ('supermarket', 'organic', 'gluten_free', 'pharmacy')),
  lat        double precision not null check (lat between -90 and 90),
  lon        double precision not null check (lon between -180 and 180),
  created_at timestamptz not null default now()
);
create index on public.stores (city);

alter table public.recipes enable row level security;
alter table public.stores  enable row level security;

create policy recipes_read on public.recipes for select to authenticated using (true);
create policy stores_read  on public.stores  for select to authenticated using (true);

-- -------------------------------------------------------------
-- Recettes de base — TODO(validation-médicale) : à faire relire par l'équipe (diététique).
-- Recettes simples, sans prétention thérapeutique ; la tolérance varie d'une personne à l'autre.
-- -------------------------------------------------------------
insert into public.recipes (slug, phase, prep_minutes, emoji,
  title_fr, title_en, title_ar, title_tn,
  summary_fr, summary_en, summary_ar, summary_tn,
  ingredients_fr, ingredients_en, ingredients_ar, ingredients_tn,
  steps_fr, steps_en, steps_ar, steps_tn) values
('riz-carottes', 'flare', 30, '🍚',
 'Riz blanc aux carottes', 'White rice with carrots', 'أرز أبيض بالجزر', 'روز أبيض بالسفنارية',
 'Un plat doux et simple, souvent bien toléré pendant une poussée.', 'A mild, simple dish, often well tolerated during a flare.', 'طبق خفيف وبسيط، غالبًا ما يُتحمَّل جيدًا أثناء النوبة.', 'ماكلة خفيفة وساهلة، برشا ناس يتحمّلوها وقت الكريز.',
 E'1 verre de riz blanc\n2 carottes\n1 filet d''huile d''olive\nSel', E'1 cup of white rice\n2 carrots\nA drizzle of olive oil\nSalt', E'كوب أرز أبيض\nحبتا جزر\nقليل من زيت الزيتون\nملح', E'كاس روز أبيض\nزوز سفنارية\nشوية زيت زيتونة\nملح',
 E'Éplucher et couper les carottes en rondelles.\nLes cuire 10 minutes dans l''eau salée.\nAjouter le riz rincé et 2 verres d''eau, cuire à couvert 15 minutes.\nServir avec un filet d''huile d''olive.', E'Peel and slice the carrots.\nCook them for 10 minutes in salted water.\nAdd the rinsed rice and 2 cups of water, cook covered for 15 minutes.\nServe with a drizzle of olive oil.', E'قشّر الجزر وقطّعه إلى شرائح.\nاطهه 10 دقائق في ماء مملّح.\nأضف الأرز المغسول وكوبين من الماء واطهه مغطّى 15 دقيقة.\nقدّمه مع قليل من زيت الزيتون.', E'قشّر السفنارية وقصّها روايض.\nطيّبها 10 دقايق في ماء بالملح.\nزيد الروز المغسول وزوز كيسان ماء، وطيّب مغطّي 15 دقيقة.\nحطّ فوقو شوية زيت زيتونة.'),
('soupe-courgettes', 'flare', 25, '🥣',
 'Velouté de courgettes', 'Courgette soup', 'حساء الكوسة', 'شربة قرع',
 'Une soupe légère à base de courgettes épluchées et de pomme de terre.', 'A light soup made with peeled courgettes and potato.', 'حساء خفيف من الكوسة المقشّرة والبطاطا.', 'شربة خفيفة بالقرع المقشّر والبطاطا.',
 E'3 courgettes\n1 pomme de terre\n1 litre d''eau\nSel, persil', E'3 courgettes\n1 potato\n1 litre of water\nSalt, parsley', E'3 حبات كوسة\nحبة بطاطا\nلتر ماء\nملح، بقدونس', E'3 قرعات\nحبة بطاطا\nلتر ماء\nملح، معدنوس',
 E'Éplucher les courgettes et la pomme de terre, les couper en morceaux.\nCuire 20 minutes dans l''eau salée.\nMixer finement et parsemer de persil.', E'Peel the courgettes and the potato, cut them into pieces.\nCook for 20 minutes in salted water.\nBlend until smooth and sprinkle with parsley.', E'قشّر الكوسة والبطاطا وقطّعهما.\nاطهها 20 دقيقة في ماء مملّح.\nاخلطها جيدًا ورشّ البقدونس.', E'قشّر القرع والبطاطا وقصّهم.\nطيّبهم 20 دقيقة في ماء بالملح.\nرحيهم بالباهي ورشّ المعدنوس.'),
('poulet-puree', 'flare', 35, '🍗',
 'Blanc de poulet et purée', 'Chicken breast with mashed potatoes', 'صدر دجاج مع البطاطا المهروسة', 'بلونك دجاج مع بيري',
 'Une source de protéines facile à digérer.', 'An easy-to-digest source of protein.', 'مصدر بروتين سهل الهضم.', 'بروتين ساهل في الهضم.',
 E'1 blanc de poulet\n3 pommes de terre\n1 filet d''huile d''olive\nSel, thym', E'1 chicken breast\n3 potatoes\nA drizzle of olive oil\nSalt, thyme', E'صدر دجاج\n3 حبات بطاطا\nقليل من زيت الزيتون\nملح، زعتر', E'بلونك دجاج\n3 حبات بطاطا\nشوية زيت زيتونة\nملح، زعتر',
 E'Cuire les pommes de terre épluchées 20 minutes à l''eau.\nCuire le poulet à la vapeur ou à la poêle sans matière grasse, avec le thym.\nÉcraser les pommes de terre avec l''huile d''olive et un peu d''eau de cuisson.', E'Boil the peeled potatoes for 20 minutes.\nSteam the chicken or cook it in a pan without fat, with the thyme.\nMash the potatoes with the olive oil and a little cooking water.', E'اسلق البطاطا المقشّرة 20 دقيقة.\nاطه الدجاج على البخار أو في مقلاة دون دهون مع الزعتر.\nاهرس البطاطا مع زيت الزيتون وقليل من ماء السلق.', E'غلّي البطاطا المقشّرة 20 دقيقة.\nطيّب الدجاج على البخار ولا في الطاجين من غير دهن، بالزعتر.\nفرّك البطاطا بزيت الزيتونة وشوية من ماء الطياب.'),
('compote-pommes', 'all', 20, '🍎',
 'Compote de pommes maison', 'Homemade apple compote', 'كومبوت التفاح', 'كومبوت تفاح',
 'Un dessert doux, sans peau ni pépins.', 'A gentle dessert, without skin or seeds.', 'تحلية خفيفة دون قشر أو بذور.', 'ديسار خفيف، من غير قشرة ولا حبّ.',
 E'4 pommes\n1 verre d''eau\nCannelle (facultatif)', E'4 apples\n1 cup of water\nCinnamon (optional)', E'4 حبات تفاح\nكوب ماء\nقرفة (اختياري)', E'4 تفاحات\nكاس ماء\nقرفة (كان تحب)',
 E'Éplucher les pommes et retirer le cœur.\nCuire à feu doux avec l''eau pendant 15 minutes.\nÉcraser à la fourchette, ajouter un peu de cannelle si elle est bien tolérée.', E'Peel and core the apples.\nCook gently with the water for 15 minutes.\nMash with a fork, add a little cinnamon if well tolerated.', E'قشّر التفاح وأزل البذور.\nاطهه على نار هادئة مع الماء 15 دقيقة.\nاهرسه بالشوكة وأضف قليلًا من القرفة إن كانت تناسبك.', E'قشّر التفاح ونحّي القلب.\nطيّبو على نار خفيفة بالماء 15 دقيقة.\nفرّكو بالفرشيطة وزيد شوية قرفة كان تتحمّلها.'),
('omelette-herbes', 'remission', 10, '🍳',
 'Omelette aux herbes', 'Herb omelette', 'عجّة بالأعشاب', 'عجّة بالمعدنوس',
 'Un repas rapide et riche en protéines.', 'A quick, protein-rich meal.', 'وجبة سريعة وغنية بالبروتين.', 'ماكلة فيسع وفيها بروتين.',
 E'2 œufs\nPersil, ciboulette\n1 filet d''huile d''olive\nSel', E'2 eggs\nParsley, chives\nA drizzle of olive oil\nSalt', E'بيضتان\nبقدونس، ثوم معمّر\nقليل من زيت الزيتون\nملح', E'زوز عظمات\nمعدنوس\nشوية زيت زيتونة\nملح',
 E'Battre les œufs avec les herbes ciselées et le sel.\nCuire 3 à 4 minutes dans une poêle légèrement huilée.', E'Beat the eggs with the chopped herbs and salt.\nCook for 3 to 4 minutes in a lightly oiled pan.', E'اخفق البيض مع الأعشاب المفرومة والملح.\nاطهه 3 إلى 4 دقائق في مقلاة مدهونة قليلًا.', E'خبّط العظم بالمعدنوس المقصوص والملح.\nطيّب 3 ولا 4 دقايق في مقلة فيها شوية زيت.'),
('poisson-legumes', 'remission', 30, '🐟',
 'Poisson au four et légumes', 'Baked fish with vegetables', 'سمك في الفرن مع الخضر', 'حوت في الفور بالخضرة',
 'Un plat complet pour les périodes de rémission.', 'A complete dish for periods of remission.', 'طبق متكامل لفترات الهدوء.', 'ماكلة كاملة لوقت الهدوء.',
 E'2 filets de poisson blanc (daurade, loup)\n2 courgettes\n1 citron\nHuile d''olive, sel, cumin', E'2 white fish fillets (sea bream, sea bass)\n2 courgettes\n1 lemon\nOlive oil, salt, cumin', E'شريحتا سمك أبيض (وراطة، قاروص)\nحبتا كوسة\nليمونة\nزيت زيتون، ملح، كمّون', E'زوز طرف حوت أبيض (وراطة، قاروص)\nزوز قرعات\nقارص\nزيت زيتونة، ملح، كمون',
 E'Préchauffer le four à 180 °C.\nDisposer le poisson et les courgettes en rondelles dans un plat, arroser d''huile et de citron.\nCuire 20 minutes.', E'Preheat the oven to 180 °C.\nPlace the fish and sliced courgettes in a dish, drizzle with oil and lemon.\nBake for 20 minutes.', E'سخّن الفرن على 180 درجة.\nضع السمك وشرائح الكوسة في صينية ورشّ الزيت والليمون.\nاطهه 20 دقيقة.', E'سخّن الفور على 180 درجة.\nحطّ الحوت والقرع مقصوص في صحفة، ورشّ الزيت والقارص.\nطيّب 20 دقيقة.');
