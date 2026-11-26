-- =============================================================
-- 0016 — Types de mesure extensibles et registre d'appareils (#134)
-- Remplace les contraintes `check` de 0015 (types et unités figés dans le code SQL) par :
--   - une table measurement_types : types standard fournis ici + types PERSONNALISÉS d'un patient ;
--   - une table health_devices : les appareils d'un patient (aucun identifiant matériel : les identifiants
--     Bluetooth restent sur le téléphone) ;
--   - un déclencheur de validation (unité permise, deuxième valeur, appareil du même patient).
-- Aucune limite « normale » ou « anormale » (règle 7 de CLAUDE.md). Les mesures de 0015 sont conservées.
-- export_my_data() est remplacée (17 clés).
-- =============================================================

-- ---------- Types de mesure ----------
create table public.measurement_types (
  code        text primary key,
  value_count smallint not null check (value_count in (1, 2)),
  units       text[] not null check (cardinality(units) between 1 and 10),
  -- nul : type standard ; sinon : type personnalisé de ce patient
  patient_id  uuid references public.profiles(id) on delete cascade,
  label       text check (char_length(label) between 1 and 80),
  -- code LOINC facultatif, pour un futur échange avec les systèmes de santé : laissé vide si inconnu
  loinc_code  text check (char_length(loinc_code) <= 20),
  created_at  timestamptz not null default now(),
  constraint measurement_types_custom_code check ((patient_id is null) = (code !~ '^custom_')),
  constraint measurement_types_custom_label check (patient_id is null or label is not null)
);
alter table public.measurement_types
  alter column code set default 'custom_' || replace(gen_random_uuid()::text, '-', '');

insert into public.measurement_types (code, value_count, units) values
  ('heart_rate',        1, '{bpm}'),
  ('blood_pressure',    2, '{mmHg}'),
  ('blood_glucose',     1, '{mg/dL,mmol/L}'),
  ('oxygen_saturation', 1, '{%}'),
  ('body_temperature',  1, '{°C,°F}'),
  ('body_weight',       1, '{kg,lb}');
-- Après les types standard (patient_id nul) : un type créé par un patient est à son nom par défaut.
alter table public.measurement_types alter column patient_id set default auth.uid();

alter table public.measurement_types enable row level security;
create policy mt_select on public.measurement_types for select to authenticated
  using (patient_id is null or patient_id = auth.uid() or public.is_assigned_to(patient_id));
create policy mt_insert on public.measurement_types for insert to authenticated
  with check (patient_id = auth.uid() and public.my_role() = 'patient');
create policy mt_delete on public.measurement_types for delete to authenticated
  using (patient_id = auth.uid());
-- Un type n'est jamais modifié (les mesures déjà saisies en dépendent).
revoke update on public.measurement_types from anon, authenticated;
revoke all on public.measurement_types from anon;

-- ---------- Registre d'appareils ----------
create table public.health_devices (
  id           uuid primary key default gen_random_uuid(),
  patient_id   uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 80),
  connection   text not null check (connection in (
                 'health_connect', 'health_kit', 'ble_standard', 'ble_vendor', 'cloud_vendor',
                 'screen_scan', 'file_import', 'manual')),
  last_sync_at timestamptz,
  created_at   timestamptz not null default now()
);
create index on public.health_devices (patient_id);

alter table public.health_devices enable row level security;
create policy hd_select on public.health_devices for select to authenticated
  using (patient_id = auth.uid() or public.is_assigned_to(patient_id));
create policy hd_insert on public.health_devices for insert to authenticated
  with check (patient_id = auth.uid() and public.my_role() = 'patient');
create policy hd_update on public.health_devices for update to authenticated
  using (patient_id = auth.uid()) with check (patient_id = auth.uid());
create policy hd_delete on public.health_devices for delete to authenticated
  using (patient_id = auth.uid());
-- Seuls le nom et la dernière synchronisation changent.
revoke update on public.health_devices from anon, authenticated;
grant update (display_name, last_sync_at) on public.health_devices to authenticated;
revoke all on public.health_devices from anon;

-- ---------- Mesures : types extensibles, appareil, sources ----------
alter table public.health_measurements
  drop constraint if exists health_measurements_kind_check,
  drop constraint if exists health_measurements_diastolic_check,
  drop constraint if exists health_measurements_unit_check,
  drop constraint if exists health_measurements_source_check;

-- NO ACTION (et non RESTRICT) : à la suppression d'un compte, les types personnalisés et les mesures
-- partent dans la même instruction ; le contrôle se fait à la fin, après les cascades.
alter table public.health_measurements
  add constraint health_measurements_kind_fkey foreign key (kind) references public.measurement_types(code),
  add column device_id uuid references public.health_devices(id) on delete set null,
  add constraint health_measurements_source_check check (source in (
    'manual', 'health_connect', 'health_kit', 'ble', 'screen_scan', 'file_import', 'cloud_vendor'));

create or replace function public.health_measurements_validate() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  t public.measurement_types%rowtype;
  device_owner uuid;
begin
  select * into t from public.measurement_types where code = new.kind;
  if not found or (t.patient_id is not null and t.patient_id <> new.patient_id) then
    raise foreign_key_violation using message = 'type de mesure inconnu ou inaccessible';
  end if;
  if not (new.unit = any (t.units)) then
    raise check_violation using message = 'unité non prévue pour ce type de mesure';
  end if;
  if (t.value_count = 2) <> (new.value_2 is not null) then
    raise check_violation using message = 'nombre de valeurs incohérent avec le type de mesure';
  end if;
  if new.device_id is not null then
    select patient_id into device_owner from public.health_devices where id = new.device_id;
    if device_owner is distinct from new.patient_id then
      raise check_violation using message = 'appareil d''un autre patient';
    end if;
  end if;
  return new;
end $$;

-- Fonction de déclencheur : personne ne l'appelle directement (securite_generale.test.sql).
revoke all on function public.health_measurements_validate() from public, anon, authenticated;

create trigger health_measurements_validate before insert on public.health_measurements
  for each row execute function public.health_measurements_validate();

-- ---------- Export : 17 clés ----------
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
    'health_measurements', coalesce((select jsonb_agg(to_jsonb(t) order by t.measured_at) from public.health_measurements t where t.patient_id = auth.uid()), '[]'::jsonb),
    -- types PERSONNALISÉS seulement : les types standard sont communs, pas des données personnelles
    'measurement_types',   coalesce((select jsonb_agg(to_jsonb(t) order by t.created_at) from public.measurement_types t where t.patient_id = auth.uid()), '[]'::jsonb),
    'health_devices',      coalesce((select jsonb_agg(to_jsonb(t) order by t.created_at) from public.health_devices t where t.patient_id = auth.uid()), '[]'::jsonb)
  )
$$;

comment on function public.export_my_data() is
  'Export complet (17 clés) des données de la personne connectée. security invoker + filtre auth.uid().';
