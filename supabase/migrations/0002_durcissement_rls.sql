-- =============================================================
-- CronCare — durcissement RLS + génération des prises (0002)
-- Ne modifie PAS 0001 : tout correctif passe par une nouvelle migration.
-- =============================================================

-- ---------- 1. Aucun accès pour les visiteurs non connectés (anon) ----------
revoke all on all tables    in schema public from anon;
revoke all on all sequences in schema public from anon;
revoke execute on all functions in schema public from anon;
alter default privileges in schema public revoke all on tables    from anon;
alter default privileges in schema public revoke all on sequences from anon;
alter default privileges in schema public revoke execute on functions from anon;

-- ---------- 2. Fonctions utilitaires ----------
-- is_assigned_to : l'affectation ne compte que si l'autre partie est réellement un soignant.
create or replace function public.is_assigned_to(p_patient uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.care_assignments ca
    join public.profiles pro on pro.id = ca.professional_id
    where ca.patient_id = p_patient
      and ca.professional_id = auth.uid()
      and pro.role in ('doctor', 'nurse')
  )
$$;

revoke execute on function public.my_role()         from public, anon;
revoke execute on function public.is_assigned_to(uuid) from public, anon;
grant  execute on function public.my_role()         to authenticated;
grant  execute on function public.is_assigned_to(uuid) to authenticated;
-- Fonction de trigger : jamais appelable depuis l'API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.monthly_adherence(date) from public, anon;
grant  execute on function public.monthly_adherence(date) to authenticated;

-- ---------- 3. Policies : réservées au rôle « authenticated » ----------
-- (0001 les avait créées sans « to » : elles s'appliquaient aussi à anon.)
drop policy profiles_select        on public.profiles;
drop policy profiles_update        on public.profiles;
drop policy assignments_select     on public.care_assignments;
drop policy rx_select              on public.prescriptions;
drop policy rx_insert              on public.prescriptions;
drop policy rx_update              on public.prescriptions;
drop policy intakes_select         on public.medication_intakes;
drop policy intakes_patient_write  on public.medication_intakes;
drop policy mood_select            on public.mood_logs;
drop policy mood_write             on public.mood_logs;
drop policy symptoms_select        on public.symptom_logs;
drop policy symptoms_write         on public.symptom_logs;
drop policy private_journal_owner  on public.private_journal;
drop policy nnotes_select          on public.nursing_notes;
drop policy nnotes_insert          on public.nursing_notes;

create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_assigned_to(id));
create policy profiles_update on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy assignments_select on public.care_assignments for select to authenticated
  using (patient_id = auth.uid() or professional_id = auth.uid());

create policy rx_select on public.prescriptions for select to authenticated
  using (patient_id = auth.uid() or public.is_assigned_to(patient_id));
create policy rx_insert on public.prescriptions for insert to authenticated
  with check (public.my_role() = 'doctor' and public.is_assigned_to(patient_id) and prescribed_by = auth.uid());
create policy rx_update on public.prescriptions for update to authenticated
  using (public.my_role() = 'doctor' and public.is_assigned_to(patient_id))
  with check (public.my_role() = 'doctor' and public.is_assigned_to(patient_id));

create policy intakes_select on public.medication_intakes for select to authenticated
  using (patient_id = auth.uid() or public.is_assigned_to(patient_id));
create policy intakes_patient_update on public.medication_intakes for update to authenticated
  using (patient_id = auth.uid()) with check (patient_id = auth.uid());

create policy mood_select on public.mood_logs for select to authenticated
  using (patient_id = auth.uid() or public.is_assigned_to(patient_id));
create policy mood_write on public.mood_logs for all to authenticated
  using (patient_id = auth.uid()) with check (patient_id = auth.uid());

create policy symptoms_select on public.symptom_logs for select to authenticated
  using (patient_id = auth.uid() or public.is_assigned_to(patient_id));
create policy symptoms_write on public.symptom_logs for all to authenticated
  using (patient_id = auth.uid()) with check (patient_id = auth.uid());

-- Journal privé : le propriétaire, et personne d'autre.
create policy private_journal_owner on public.private_journal for all to authenticated
  using (patient_id = auth.uid()) with check (patient_id = auth.uid());

create policy nnotes_select on public.nursing_notes for select to authenticated
  using (patient_id = auth.uid() or public.is_assigned_to(patient_id));
create policy nnotes_insert on public.nursing_notes for insert to authenticated
  with check (public.my_role() = 'nurse' and public.is_assigned_to(patient_id) and nurse_id = auth.uid());
create policy nnotes_update on public.nursing_notes for update to authenticated
  using (nurse_id = auth.uid() and public.my_role() = 'nurse' and public.is_assigned_to(patient_id))
  with check (nurse_id = auth.uid() and public.my_role() = 'nurse' and public.is_assigned_to(patient_id));
create policy nnotes_delete on public.nursing_notes for delete to authenticated
  using (nurse_id = auth.uid() and public.my_role() = 'nurse' and public.is_assigned_to(patient_id));

-- ---------- 4. Droits par colonne ----------
-- Prescriptions : patient_id et prescribed_by ne changent jamais après la création.
revoke update on public.prescriptions from authenticated;
grant update (medication, dosage, times_of_day, start_date, end_date, active)
  on public.prescriptions to authenticated;

-- Prises : le patient ne peut cocher qu'une prise (statut + date), pas la déplacer ni la réattribuer.
revoke update on public.medication_intakes from authenticated;
grant update (status, taken_at) on public.medication_intakes to authenticated;
-- « taken » exige taken_at (NOT VALID : ne bloque pas d'éventuelles lignes antérieures, protège les écritures futures).
alter table public.medication_intakes
  add constraint intakes_taken_has_date check (status <> 'taken' or taken_at is not null) not valid;
-- Une même prise (prescription, horaire) n'existe qu'une fois : rend la génération idempotente.
create unique index medication_intakes_unique_slot
  on public.medication_intakes (prescription_id, scheduled_at);

-- Observations : seul le contenu est modifiable.
revoke update on public.nursing_notes from authenticated;
grant update (content) on public.nursing_notes to authenticated;

-- ---------- 5. Génération des prises ----------
-- Fuseau de l'application : Africa/Tunis. Les horaires (type time) sont des heures locales.
-- On part de max(start_date, aujourd'hui) et on ne crée jamais de prise déjà passée :
-- sinon une prescription saisie à 10 h créerait aussitôt une prise de 8 h « manquée ».
create function public.generate_intakes(p_prescription uuid, p_days int default 14)
returns int language plpgsql security definer set search_path = public as $$
declare
  rx    public.prescriptions;
  base  date;
  n     int;
begin
  select * into rx from public.prescriptions where id = p_prescription and active;
  if not found then return 0; end if;
  base := greatest(rx.start_date, (now() at time zone 'Africa/Tunis')::date);

  with ins as (
    insert into public.medication_intakes (prescription_id, patient_id, scheduled_at)
    select rx.id, rx.patient_id, ((base + i) + t) at time zone 'Africa/Tunis'
    from generate_series(0, least(greatest(p_days, 1), 60) - 1) as i
    cross join unnest(rx.times_of_day) as t
    where (rx.end_date is null or base + i <= rx.end_date)
      and (((base + i) + t) at time zone 'Africa/Tunis') > now()
    on conflict (prescription_id, scheduled_at) do nothing
    returning 1
  )
  select count(*) into n from ins;
  return n;
end $$;

-- Interne : appelée par les triggers et par refresh_my_intakes, jamais par l'API.
revoke execute on function public.generate_intakes(uuid, int) from public, anon, authenticated;

create function public.prescriptions_sync_intakes() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'UPDATE' then
    -- Les prises futures encore en attente sont recalculées ; l'historique (prises cochées) reste.
    delete from public.medication_intakes
    where prescription_id = new.id and status = 'pending' and scheduled_at > now();
  end if;
  perform public.generate_intakes(new.id);
  return new;
end $$;
revoke execute on function public.prescriptions_sync_intakes() from public, anon, authenticated;

create trigger prescriptions_sync_intakes
  after insert or update of times_of_day, start_date, end_date, active
  on public.prescriptions
  for each row execute function public.prescriptions_sync_intakes();

-- Réapprovisionnement : le patient connecté complète SES prises à venir (appelé à l'ouverture de l'app).
create function public.refresh_my_intakes(p_days int default 14) returns int
language plpgsql security definer set search_path = public as $$
declare
  total int := 0;
  r record;
begin
  if auth.uid() is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  for r in select id from public.prescriptions where patient_id = auth.uid() and active loop
    total := total + public.generate_intakes(r.id, p_days);
  end loop;
  return total;
end $$;
revoke execute on function public.refresh_my_intakes(int) from public, anon;
grant  execute on function public.refresh_my_intakes(int) to authenticated;

-- Suppression de compte : déjà limitée à authenticated par 0001 ; on retire aussi le droit « public ».
revoke execute on function public.delete_my_account() from public, anon;
grant  execute on function public.delete_my_account() to authenticated;
