-- =============================================================
-- CronCare — schéma initial + RBAC (Patient / Médecin / Infirmier)
-- Principe : toute la sécurité est appliquée côté base via RLS.
-- Le front ne fait que masquer l'UI ; il n'est jamais la barrière.
-- =============================================================

create type public.app_role as enum ('patient', 'doctor', 'nurse');
create type public.intake_status as enum ('pending', 'taken', 'skipped');

-- ---------- Profils ----------
create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  first_name    text not null default '',
  last_name     text not null default '',
  role          public.app_role not null default 'patient',
  language      text not null default 'fr' check (language in ('fr','en','ar','tn')),
  notif_meds    boolean not null default true,
  notif_community boolean not null default true,
  notif_tips    boolean not null default true,
  created_at    timestamptz not null default now()
);

-- Création automatique du profil à l'inscription (toujours en "patient").
-- Les comptes médecin/infirmier sont promus par un admin (service_role).
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, first_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'first_name', ''));
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Affectation soignant ↔ patient ----------
create table public.care_assignments (
  patient_id      uuid not null references public.profiles(id) on delete cascade,
  professional_id uuid not null references public.profiles(id) on delete cascade,
  created_at      timestamptz not null default now(),
  primary key (patient_id, professional_id)
);

-- ---------- Fonctions utilitaires RBAC ----------
create function public.my_role() returns public.app_role
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;

create function public.is_assigned_to(p_patient uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.care_assignments
    where patient_id = p_patient and professional_id = auth.uid()
  )
$$;

-- ---------- Prescriptions ----------
create table public.prescriptions (
  id            uuid primary key default gen_random_uuid(),
  patient_id    uuid not null references public.profiles(id) on delete cascade,
  prescribed_by uuid not null references public.profiles(id),
  medication    text not null,
  dosage        text not null,
  times_of_day  time[] not null,           -- ex. {08:00, 20:00}
  start_date    date not null default current_date,
  end_date      date,
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);

-- ---------- Prises médicamenteuses ----------
create table public.medication_intakes (
  id              uuid primary key default gen_random_uuid(),
  prescription_id uuid not null references public.prescriptions(id) on delete cascade,
  patient_id      uuid not null references public.profiles(id) on delete cascade,
  scheduled_at    timestamptz not null,
  taken_at        timestamptz,
  status          public.intake_status not null default 'pending'
);
create index on public.medication_intakes (patient_id, scheduled_at);

-- ---------- État émotionnel quotidien ----------
create table public.mood_logs (
  patient_id uuid not null references public.profiles(id) on delete cascade,
  day        date not null default current_date,
  mood       smallint not null check (mood between 1 and 5),
  primary key (patient_id, day)
);

-- ---------- Journal des symptômes (partagé avec l'équipe soignante) ----------
create table public.symptom_logs (
  id          uuid primary key default gen_random_uuid(),
  patient_id  uuid not null references public.profiles(id) on delete cascade,
  logged_at   timestamptz not null default now(),
  pain_level  smallint check (pain_level between 0 and 10),
  stools_per_day smallint,
  notes       text
);

-- ---------- Journal privé (patient UNIQUEMENT, jamais visible des soignants) ----------
create table public.private_journal (
  id         uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  content    text not null
);

-- ---------- Observations infirmières ----------
create table public.nursing_notes (
  id         uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles(id) on delete cascade,
  nurse_id   uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  content    text not null
);

-- ---------- Conseils du jour (contenu éducatif public) ----------
create table public.tips (
  id       serial primary key,
  category text not null,
  fr text not null, en text, ar text, tn text
);

-- =============================================================
-- Row Level Security
-- =============================================================
alter table public.profiles           enable row level security;
alter table public.care_assignments   enable row level security;
alter table public.prescriptions      enable row level security;
alter table public.medication_intakes enable row level security;
alter table public.mood_logs          enable row level security;
alter table public.symptom_logs       enable row level security;
alter table public.private_journal    enable row level security;
alter table public.nursing_notes      enable row level security;
alter table public.tips               enable row level security;

-- Profils : soi-même, ou un patient qui m'est affecté
create policy profiles_select on public.profiles for select
  using (id = auth.uid() or public.is_assigned_to(id));

-- Un utilisateur modifie son profil, mais PAS son rôle (voir GRANT plus bas)
create policy profiles_update on public.profiles for update
  using (id = auth.uid()) with check (id = auth.uid());
revoke update on public.profiles from authenticated;
grant update (first_name, last_name, language, notif_meds, notif_community, notif_tips)
  on public.profiles to authenticated;

-- Affectations : visibles par les deux parties ; gérées par l'admin uniquement
create policy assignments_select on public.care_assignments for select
  using (patient_id = auth.uid() or professional_id = auth.uid());

-- Prescriptions : lecture patient + soignants affectés ; écriture MÉDECIN affecté seulement
create policy rx_select on public.prescriptions for select
  using (patient_id = auth.uid() or public.is_assigned_to(patient_id));
create policy rx_insert on public.prescriptions for insert
  with check (public.my_role() = 'doctor' and public.is_assigned_to(patient_id)
              and prescribed_by = auth.uid());
create policy rx_update on public.prescriptions for update
  using (public.my_role() = 'doctor' and public.is_assigned_to(patient_id))
  with check (public.my_role() = 'doctor' and public.is_assigned_to(patient_id));

-- Prises : le patient coche ses prises ; les soignants affectés consultent
create policy intakes_select on public.medication_intakes for select
  using (patient_id = auth.uid() or public.is_assigned_to(patient_id));
create policy intakes_patient_write on public.medication_intakes for update
  using (patient_id = auth.uid()) with check (patient_id = auth.uid());

-- Humeur : patient (écriture) ; soignants affectés (lecture)
create policy mood_select on public.mood_logs for select
  using (patient_id = auth.uid() or public.is_assigned_to(patient_id));
create policy mood_write on public.mood_logs for all
  using (patient_id = auth.uid()) with check (patient_id = auth.uid());

-- Symptômes : patient (écriture) ; soignants affectés (lecture)
create policy symptoms_select on public.symptom_logs for select
  using (patient_id = auth.uid() or public.is_assigned_to(patient_id));
create policy symptoms_write on public.symptom_logs for all
  using (patient_id = auth.uid()) with check (patient_id = auth.uid());

-- Journal privé : patient uniquement, aucune exception
create policy private_journal_owner on public.private_journal for all
  using (patient_id = auth.uid()) with check (patient_id = auth.uid());

-- Observations infirmières : rédigées par l'infirmier affecté ; lues par l'équipe et le patient
create policy nnotes_select on public.nursing_notes for select
  using (patient_id = auth.uid() or public.is_assigned_to(patient_id));
create policy nnotes_insert on public.nursing_notes for insert
  with check (public.my_role() = 'nurse' and public.is_assigned_to(patient_id)
              and nurse_id = auth.uid());

-- Conseils : lecture pour tout utilisateur connecté
create policy tips_read on public.tips for select to authenticated using (true);

-- =============================================================
-- Fonctions métier
-- =============================================================

-- Observance mensuelle (%) du patient connecté
create function public.monthly_adherence(p_month date default current_date)
returns numeric language sql stable security invoker as $$
  select coalesce(round(100.0 * count(*) filter (where status = 'taken')
         / nullif(count(*), 0), 1), 0)
  from public.medication_intakes
  where patient_id = auth.uid()
    and scheduled_at >= date_trunc('month', p_month)
    and scheduled_at <  date_trunc('month', p_month) + interval '1 month'
    and scheduled_at <= now()
$$;

-- Suppression du compte (Paramètres > Confidentialité)
create function public.delete_my_account() returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  delete from auth.users where id = auth.uid();   -- cascade sur toutes les tables
end $$;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
