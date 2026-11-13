-- =============================================================
-- 0002 — Génération des prises médicamenteuses
-- - unicité (prescription_id, scheduled_at) : pas de doublon
-- - generate_intakes(p_days) : crée les prises du patient connecté
-- - le patient ne peut modifier QUE status / taken_at de ses prises
-- - une prescription modifiée ou désactivée purge ses prises futures en attente
-- Les horaires (times_of_day) sont exprimés en heure locale tunisienne.
-- =============================================================

alter table public.medication_intakes
  add constraint medication_intakes_prescription_scheduled_key unique (prescription_id, scheduled_at);

-- Le patient coche « Pris » / « Sauté » mais ne peut pas déplacer une prise ni la rattacher
-- à une autre prescription (la policy intakes_patient_write de 0001 reste la barrière de lignes).
revoke update on public.medication_intakes from authenticated;
grant update (status, taken_at) on public.medication_intakes to authenticated;

-- Crée les prises des p_days prochains jours (aujourd'hui inclus) pour le patient connecté,
-- à partir de ses prescriptions actives. Idempotent. Renvoie le nombre de prises créées.
create function public.generate_intakes(p_days int default 7) returns int
language plpgsql security definer set search_path = public as $$
declare
  v_uid   uuid := auth.uid();
  v_today date := (now() at time zone 'Africa/Tunis')::date;
  v_count int;
begin
  if v_uid is null then raise exception 'not authenticated' using errcode = '42501'; end if;
  if p_days is null or p_days < 1 or p_days > 31 then
    raise exception 'p_days doit être compris entre 1 et 31' using errcode = '22023';
  end if;

  insert into public.medication_intakes (prescription_id, patient_id, scheduled_at)
  select p.id, p.patient_id, (d::date + t) at time zone 'Africa/Tunis'
  from public.prescriptions p
  cross join lateral generate_series(
    greatest(p.start_date, v_today),
    least(coalesce(p.end_date, v_today + (p_days - 1)), v_today + (p_days - 1)),
    interval '1 day') as d
  cross join lateral unnest(p.times_of_day) as t
  where p.patient_id = v_uid and p.active
  on conflict (prescription_id, scheduled_at) do nothing;

  get diagnostics v_count = row_count;
  return v_count;
end $$;
revoke all on function public.generate_intakes(int) from public, anon;
grant execute on function public.generate_intakes(int) to authenticated;

-- Quand un médecin désactive une prescription ou change ses horaires / dates, les prises
-- futures encore en attente sont supprimées ; elles seront régénérées à la prochaine ouverture.
create function public.purge_future_intakes() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  delete from public.medication_intakes
  where prescription_id = new.id and status = 'pending' and scheduled_at > now();
  return new;
end $$;

create trigger prescriptions_purge_future_intakes
  after update of active, times_of_day, start_date, end_date on public.prescriptions
  for each row
  when (old.active is distinct from new.active
        or old.times_of_day is distinct from new.times_of_day
        or old.start_date is distinct from new.start_date
        or old.end_date is distinct from new.end_date)
  execute function public.purge_future_intakes();
