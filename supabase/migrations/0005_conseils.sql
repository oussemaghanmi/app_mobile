-- =============================================================
-- 0005 — Conseils de vie : contenu de base de la table tips
-- (0001 crée la table, seed.sql n'est joué qu'en local).
-- TODO(validation-médicale) : conseils généraux à faire relire par l'équipe soignante.
-- =============================================================

alter table public.tips add constraint tips_category_check
  check (category in ('hydratation', 'tabac', 'sommeil', 'stress', 'activite', 'voyage', 'alimentation', 'suivi'));

insert into public.tips (category, fr, en, ar, tn) values
('sommeil',
 'Gardez des horaires de coucher réguliers : un bon sommeil aide à mieux supporter la fatigue.',
 'Keep regular bedtimes: good sleep helps you cope better with fatigue.',
 'حافظ على مواعيد نوم منتظمة: النوم الجيد يساعد على تحمّل التعب.',
 'رقد في نفس الوقت كل ليلة: النوم الباهي يعاونك على التعب.'),
('stress',
 'Le stress ne cause pas la maladie, mais il peut rendre les symptômes plus pénibles. Respiration lente, marche ou prière peuvent aider à se détendre.',
 'Stress does not cause the disease, but it can make symptoms harder to bear. Slow breathing, walking or prayer can help you relax.',
 'التوتر لا يسبّب المرض، لكنه قد يجعل الأعراض أصعب. التنفّس الهادئ أو المشي أو الصلاة قد تساعد على الاسترخاء.',
 'القلق موش هو اللي يجيب المرض، أما ينجّم يصعّب الأعراض. التنفّس بالشوية، المشي ولا الصلاة ينجّمو يريّحوك.'),
('activite',
 'Une marche de 20 à 30 minutes par jour, à votre rythme, aide contre la fatigue et renforce les os.',
 'A 20 to 30 minute walk a day, at your own pace, helps against fatigue and strengthens bones.',
 'المشي من 20 إلى 30 دقيقة يوميًا حسب قدرتك يساعد على مقاومة التعب ويقوّي العظام.',
 'امشي 20 ولا 30 دقيقة كل نهار على قدّك: يعاونك على التعب ويقوّي العظم.'),
('voyage',
 'En voyage, emportez votre traitement dans votre bagage à main, avec l''ordonnance, et repérez les toilettes sur le trajet.',
 'When travelling, keep your treatment in your hand luggage with the prescription, and locate toilets along the way.',
 'عند السفر، احمل علاجك في حقيبة اليد مع الوصفة الطبية، وحدّد أماكن دورات المياه في الطريق.',
 'كي تسافر، هزّ دواك في الصاك اللي معاك مع الوصفة، وشوف وين فمّا تواليت في الثنية.'),
('alimentation',
 'Pendant une poussée, préférez des repas légers et fractionnés, et notez dans le journal les aliments qui vous gênent.',
 'During a flare, prefer light, smaller meals and note in the journal the foods that bother you.',
 'أثناء النوبة، فضّل وجبات خفيفة ومقسّمة، وسجّل في اليوميات الأطعمة التي تزعجك.',
 'وقت الكريز، كول ماكلة خفيفة ومقسومة على برشا مرّات، وسجّل في الجورنال الماكلة اللي تقلقك.'),
('suivi',
 'Préparez vos consultations : notez vos questions et vos symptômes à l''avance. L''export du journal peut vous aider.',
 'Prepare your appointments: write down your questions and symptoms in advance. Exporting your journal can help.',
 'حضّر لمواعيدك الطبية: دوّن أسئلتك وأعراضك مسبقًا. يمكن أن يساعدك تصدير اليوميات.',
 'حضّر للكونسولتة: اكتب الأسئلة والأعراض متاعك قبل. تصدير الجورنال ينجّم يعاونك.'),
('hydratation',
 'En été ou en cas de diarrhée, buvez davantage et pensez aux soupes et bouillons.',
 'In summer or with diarrhoea, drink more and think of soups and broths.',
 'في الصيف أو عند الإسهال، اشرب أكثر وفكّر في الحساء والمرق.',
 'في الصيف ولا كي كرشك تجري، اشرب أكثر وما تنساش الشربة والمرقة.'),
('tabac',
 'La chicha au café, c''est aussi du tabac : profitez des sorties entre amis avec un thé ou un jus.',
 'Shisha at the café is tobacco too: enjoy outings with friends over a tea or a juice.',
 'الشيشة في المقهى هي أيضًا تبغ: استمتع بالخروج مع الأصدقاء مع كأس شاي أو عصير.',
 'الشيشة في القهوة راهي دخان زادة: اقعد مع صحابك بتاي ولا بعصير.');
