-- =============================================================
-- 0013 — Export complet des données de la personne connectée
-- export_my_data() renvoie un objet JSON dont chaque clé est une table et chaque valeur
-- le tableau de SES lignes ([] si aucune, jamais null). Utilisée par l'export de l'application.
-- - security invoker : le RLS reste la barrière (règle 1 de CLAUDE.md).
-- - Filtre explicite sur auth.uid() en plus du RLS : certaines tables (publications,
--   commentaires, pseudonymes de la communauté) sont lisibles par tous les connectés, et un
--   soignant lit les données de ses patients affectés ; l'export ne doit contenir que les siennes.
-- - private_journal n'est exporté que vers son auteur (patient_id = auth.uid()).
-- =============================================================

create function public.export_my_data() returns jsonb
language sql stable security invoker set search_path = public as $$
  select jsonb_build_object(
    'profiles',           coalesce((select jsonb_agg(to_jsonb(t)) from public.profiles t           where t.id = auth.uid()), '[]'::jsonb),
    'care_assignments',   coalesce((select jsonb_agg(to_jsonb(t)) from public.care_assignments t   where t.patient_id = auth.uid()), '[]'::jsonb),
    'prescriptions',      coalesce((select jsonb_agg(to_jsonb(t) order by t.created_at) from public.prescriptions t where t.patient_id = auth.uid()), '[]'::jsonb),
    'medication_intakes', coalesce((select jsonb_agg(to_jsonb(t) order by t.scheduled_at) from public.medication_intakes t where t.patient_id = auth.uid()), '[]'::jsonb),
    'mood_logs',          coalesce((select jsonb_agg(to_jsonb(t) order by t.day) from public.mood_logs t where t.patient_id = auth.uid()), '[]'::jsonb),
    'symptom_logs',       coalesce((select jsonb_agg(to_jsonb(t) order by t.logged_at) from public.symptom_logs t where t.patient_id = auth.uid()), '[]'::jsonb),
    'private_journal',    coalesce((select jsonb_agg(to_jsonb(t) order by t.created_at) from public.private_journal t where t.patient_id = auth.uid()), '[]'::jsonb),
    'nursing_notes',      coalesce((select jsonb_agg(to_jsonb(t) order by t.created_at) from public.nursing_notes t where t.patient_id = auth.uid()), '[]'::jsonb),
    'appointments',       coalesce((select jsonb_agg(to_jsonb(t) order by t.starts_at) from public.appointments t where t.patient_id = auth.uid()), '[]'::jsonb),
    'community_profiles', coalesce((select jsonb_agg(to_jsonb(t)) from public.community_profiles t where t.user_id = auth.uid()), '[]'::jsonb),
    'community_posts',    coalesce((select jsonb_agg(to_jsonb(t) order by t.created_at) from public.community_posts t where t.author_id = auth.uid()), '[]'::jsonb),
    'community_comments', coalesce((select jsonb_agg(to_jsonb(t) order by t.created_at) from public.community_comments t where t.author_id = auth.uid()), '[]'::jsonb),
    'reports',            coalesce((select jsonb_agg(to_jsonb(t) order by t.created_at) from public.reports t where t.reporter_id = auth.uid()), '[]'::jsonb),
    'chatbot_usage',      coalesce((select jsonb_agg(to_jsonb(t) order by t.day) from public.chatbot_usage t where t.user_id = auth.uid()), '[]'::jsonb)
  )
$$;

comment on function public.export_my_data() is
  'Export complet (14 tables) des données de la personne connectée. security invoker + filtre auth.uid().';

-- Exécutable par les seuls utilisateurs connectés (les privilèges par défaut de 0011 retirent déjà public et anon).
revoke all on function public.export_my_data() from public, anon;
grant execute on function public.export_my_data() to authenticated;
