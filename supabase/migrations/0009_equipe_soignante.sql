-- =============================================================
-- 0009 — Équipe soignante : visibilité mutuelle des noms
-- - un patient voit le profil (nom) des soignants qui lui sont affectés ;
-- - deux soignants affectés à un même patient se voient mutuellement.
-- Utile pour afficher l'auteur d'une prescription, d'une observation ou d'un rendez-vous.
-- Aucun autre accès : un patient ne voit toujours pas les autres patients.
-- =============================================================

create function public.in_my_care_team(p_profile uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.care_assignments a
    where a.patient_id = auth.uid() and a.professional_id = p_profile
  ) or exists (
    select 1 from public.care_assignments mine
    join public.care_assignments other on other.patient_id = mine.patient_id
    where mine.professional_id = auth.uid() and other.professional_id = p_profile
  )
$$;

create policy profiles_select_care_team on public.profiles for select
  using (public.in_my_care_team(id));
