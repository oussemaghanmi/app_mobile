-- =============================================================
-- 0007 — Journal des symptômes : indiquer les jours de règles
-- (aide le médecin à distinguer les symptômes liés au cycle d'une poussée).
-- Les policies de symptom_logs (0001) s'appliquent inchangées.
-- =============================================================
alter table public.symptom_logs add column on_period boolean not null default false;
alter table public.symptom_logs add constraint symptom_logs_stools_check check (stools_per_day between 0 and 50);
alter table public.symptom_logs add constraint symptom_logs_notes_check check (char_length(notes) <= 2000);
alter table public.private_journal add constraint private_journal_content_check
  check (char_length(btrim(content)) between 1 and 10000);
