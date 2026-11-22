-- =============================================================
-- 0003 — Observance : une prise cochée en avance compte dans le mois
-- (0001 ne comptait que les prises dont l'heure était passée).
-- =============================================================
create or replace function public.monthly_adherence(p_month date default current_date)
returns numeric language sql stable security invoker set search_path = public as $$
  select coalesce(round(100.0 * count(*) filter (where status = 'taken')
         / nullif(count(*), 0), 1), 0)
  from public.medication_intakes
  where patient_id = auth.uid()
    and scheduled_at >= date_trunc('month', p_month)
    and scheduled_at <  date_trunc('month', p_month) + interval '1 month'
    and (scheduled_at <= now() or status = 'taken')
$$;
