-- =============================================================
-- 0008 — Rendez-vous
-- Créés / modifiés / supprimés par le soignant affecté qui en est l'auteur ;
-- lus par le patient et par les soignants affectés.
-- =============================================================

create table public.appointments (
  id               uuid primary key default gen_random_uuid(),
  patient_id       uuid not null references public.profiles(id) on delete cascade,
  professional_id  uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  starts_at        timestamptz not null,
  duration_minutes smallint not null default 30 check (duration_minutes between 5 and 480),
  location         text check (char_length(location) <= 200),
  notes            text check (char_length(notes) <= 1000),
  created_at       timestamptz not null default now()
);
create index on public.appointments (patient_id, starts_at);

alter table public.appointments enable row level security;

create policy appt_select on public.appointments for select
  using (patient_id = auth.uid() or public.is_assigned_to(patient_id));

create policy appt_insert on public.appointments for insert
  with check (public.my_role() in ('doctor', 'nurse')
              and public.is_assigned_to(patient_id)
              and professional_id = auth.uid());

create policy appt_update on public.appointments for update
  using (professional_id = auth.uid() and public.is_assigned_to(patient_id))
  with check (professional_id = auth.uid() and public.is_assigned_to(patient_id));

create policy appt_delete on public.appointments for delete
  using (professional_id = auth.uid() and public.is_assigned_to(patient_id));
