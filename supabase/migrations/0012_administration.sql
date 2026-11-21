-- =============================================================
-- CronCare — administration des rôles et des affectations (0012)
-- Jusqu'ici : du SQL écrit à la main (seed.sql). Ces fonctions donnent une procédure unique, validée,
-- réservée à l'administration : exécutables par service_role (ou depuis le SQL Editor de Supabase,
-- qui tourne avec le rôle propriétaire), jamais par anon ni authenticated, donc jamais depuis l'application.
-- =============================================================

-- Attribue un rôle à un compte existant.
-- Refuse un changement qui laisserait des affectations incohérentes : il faut d'abord les retirer.
create function public.admin_set_role(p_user uuid, p_role public.app_role) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.profiles where id = p_user) then
    raise exception 'admin_set_role : compte inconnu (%)', p_user;
  end if;
  if p_role = 'patient' and exists (select 1 from public.care_assignments where professional_id = p_user) then
    raise exception 'admin_set_role : % est affecté à des patients ; retirer ses affectations (admin_unassign) d''abord', p_user;
  end if;
  if p_role <> 'patient' and exists (select 1 from public.care_assignments where patient_id = p_user) then
    raise exception 'admin_set_role : % est suivi par des soignants ; retirer ses affectations (admin_unassign) d''abord', p_user;
  end if;
  update public.profiles set role = p_role where id = p_user;
end $$;

-- Affecte un soignant (médecin ou infirmier) à un patient. Sans effet si l'affectation existe déjà.
create function public.admin_assign(p_patient uuid, p_professional uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  patient_role public.app_role;
  pro_role     public.app_role;
begin
  select role into patient_role from public.profiles where id = p_patient;
  if patient_role is null then
    raise exception 'admin_assign : patient inconnu (%)', p_patient;
  end if;
  if patient_role <> 'patient' then
    raise exception 'admin_assign : % n''a pas le rôle patient', p_patient;
  end if;
  select role into pro_role from public.profiles where id = p_professional;
  if pro_role is null then
    raise exception 'admin_assign : soignant inconnu (%)', p_professional;
  end if;
  if pro_role not in ('doctor', 'nurse') then
    raise exception 'admin_assign : % n''est ni médecin ni infirmier', p_professional;
  end if;
  insert into public.care_assignments (patient_id, professional_id)
  values (p_patient, p_professional)
  on conflict do nothing;
end $$;

-- Retire une affectation. Sans effet si elle n'existe pas.
create function public.admin_unassign(p_patient uuid, p_professional uuid) returns void
language sql security definer set search_path = public as $$
  delete from public.care_assignments where patient_id = p_patient and professional_id = p_professional
$$;

-- Réservées à service_role. (0011 retire déjà l'exécution à anon ; authenticated l'avait par défaut.)
revoke execute on function public.admin_set_role(uuid, public.app_role) from public, anon, authenticated;
revoke execute on function public.admin_assign(uuid, uuid)              from public, anon, authenticated;
revoke execute on function public.admin_unassign(uuid, uuid)            from public, anon, authenticated;
grant  execute on function public.admin_set_role(uuid, public.app_role) to service_role;
grant  execute on function public.admin_assign(uuid, uuid)              to service_role;
grant  execute on function public.admin_unassign(uuid, uuid)            to service_role;
