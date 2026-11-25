-- =============================================================
-- 0015 — Mesures de santé : fréquence cardiaque, tension, glycémie
-- Une table unique alimentée par la saisie manuelle, puis par Health Connect et le Bluetooth.
-- - Contraintes de validité TECHNIQUE seulement : aucune limite « normale » ou « anormale »
--   (ce serait du contenu médical, règle 7 de CLAUDE.md).
-- - Le patient lit, saisit et supprime SES mesures ; aucune mesure n'est jamais modifiée (une erreur de
--   saisie se corrige en supprimant puis en ressaisissant ; une mesure d'appareil reste telle quelle).
-- - Médecin et infirmier affectés : lecture seule. Aucun accès pour anon ni pour un proche.
-- - export_my_data() est remplacée pour exporter aussi cette table (15 clés).
-- =============================================================

create table public.health_measurements (
  id          uuid primary key default gen_random_uuid(),
  patient_id  uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  kind        text not null check (kind in ('heart_rate', 'blood_pressure', 'blood_glucose')),
  value_1     numeric not null check (value_1 > 0),
  value_2     numeric check (value_2 > 0),
  unit        text not null,
  measured_at timestamptz not null,
  source      text not null default 'manual' check (source in ('manual', 'health_connect', 'ble')),
  source_ref  text check (char_length(source_ref) <= 200),
  created_at  timestamptz not null default now(),
  -- Tension : value_1 systolique, value_2 diastolique (obligatoire) ; autres types : value_2 absent.
  constraint health_measurements_diastolic_check check ((kind = 'blood_pressure') = (value_2 is not null)),
  -- Unité imposée par le type ; la glycémie garde l'unité de l'appareil (aucune conversion silencieuse).
  constraint health_measurements_unit_check check (
    (kind = 'heart_rate' and unit = 'bpm')
    or (kind = 'blood_pressure' and unit = 'mmHg')
    or (kind = 'blood_glucose' and unit in ('mg/dL', 'mmol/L'))
  ),
  -- Pas de mesure dans le futur, avec une tolérance de 5 minutes pour les horloges des appareils.
  constraint health_measurements_not_future check (measured_at <= now() + interval '5 minutes')
);

create index on public.health_measurements (patient_id, kind, measured_at desc);
-- Évite les doublons lors des synchronisations (Health Connect, Bluetooth).
create unique index health_measurements_source_ref_key
  on public.health_measurements (patient_id, source, source_ref) where source_ref is not null;

alter table public.health_measurements enable row level security;

create policy hm_select on public.health_measurements for select to authenticated
  using (patient_id = auth.uid() or public.is_assigned_to(patient_id));
create policy hm_insert on public.health_measurements for insert to authenticated
  with check (patient_id = auth.uid() and public.my_role() = 'patient');
create policy hm_delete on public.health_measurements for delete to authenticated
  using (patient_id = auth.uid());
-- Aucune policy de mise à jour, et aucun droit de mise à jour : une mesure n'est jamais modifiée.
revoke update on public.health_measurements from anon, authenticated;
revoke all on public.health_measurements from anon;

-- ---------- Export : ajout de health_measurements (15 clés) ----------
create or replace function public.export_my_data() returns jsonb
language sql stable security invoker set search_path = public as $$
  select jsonb_build_object(
    'profiles',            coalesce((select jsonb_agg(to_jsonb(t)) from public.profiles t           where t.id = auth.uid()), '[]'::jsonb),
    'care_assignments',    coalesce((select jsonb_agg(to_jsonb(t)) from public.care_assignments t   where t.patient_id = auth.uid()), '[]'::jsonb),
    'prescriptions',       coalesce((select jsonb_agg(to_jsonb(t) order by t.created_at) from public.prescriptions t where t.patient_id = auth.uid()), '[]'::jsonb),
    'medication_intakes',  coalesce((select jsonb_agg(to_jsonb(t) order by t.scheduled_at) from public.medication_intakes t where t.patient_id = auth.uid()), '[]'::jsonb),
    'mood_logs',           coalesce((select jsonb_agg(to_jsonb(t) order by t.day) from public.mood_logs t where t.patient_id = auth.uid()), '[]'::jsonb),
    'symptom_logs',        coalesce((select jsonb_agg(to_jsonb(t) order by t.logged_at) from public.symptom_logs t where t.patient_id = auth.uid()), '[]'::jsonb),
    'private_journal',     coalesce((select jsonb_agg(to_jsonb(t) order by t.created_at) from public.private_journal t where t.patient_id = auth.uid()), '[]'::jsonb),
    'nursing_notes',       coalesce((select jsonb_agg(to_jsonb(t) order by t.created_at) from public.nursing_notes t where t.patient_id = auth.uid()), '[]'::jsonb),
    'appointments',        coalesce((select jsonb_agg(to_jsonb(t) order by t.starts_at) from public.appointments t where t.patient_id = auth.uid()), '[]'::jsonb),
    'community_profiles',  coalesce((select jsonb_agg(to_jsonb(t)) from public.community_profiles t where t.user_id = auth.uid()), '[]'::jsonb),
    'community_posts',     coalesce((select jsonb_agg(to_jsonb(t) order by t.created_at) from public.community_posts t where t.author_id = auth.uid()), '[]'::jsonb),
    'community_comments',  coalesce((select jsonb_agg(to_jsonb(t) order by t.created_at) from public.community_comments t where t.author_id = auth.uid()), '[]'::jsonb),
    'reports',             coalesce((select jsonb_agg(to_jsonb(t) order by t.created_at) from public.reports t where t.reporter_id = auth.uid()), '[]'::jsonb),
    'chatbot_usage',       coalesce((select jsonb_agg(to_jsonb(t) order by t.day) from public.chatbot_usage t where t.user_id = auth.uid()), '[]'::jsonb),
    'health_measurements', coalesce((select jsonb_agg(to_jsonb(t) order by t.measured_at) from public.health_measurements t where t.patient_id = auth.uid()), '[]'::jsonb)
  )
$$;

comment on function public.export_my_data() is
  'Export complet (15 tables) des données de la personne connectée. security invoker + filtre auth.uid().';
