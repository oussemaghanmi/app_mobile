-- =============================================================
-- CronCare — durcissement des accès (0011)
-- Défense en profondeur : même si une policy était oubliée ou erronée, un visiteur non connecté
-- (rôle anon) n'a aucun droit. Ne modifie aucune migration existante.
-- =============================================================

-- ---------- 1. anon : aucun droit sur public (tables, séquences, fonctions) ----------
revoke all on all tables    in schema public from anon;
revoke all on all sequences in schema public from anon;
revoke execute on all functions in schema public from public, anon;
alter default privileges in schema public revoke all on tables    from anon;
alter default privileges in schema public revoke all on sequences from anon;
alter default privileges in schema public revoke execute on functions from public, anon;

-- Les fonctions de l'application restent exécutables par les utilisateurs connectés. Le droit est accordé
-- explicitement : retirer « public » ci-dessus ne doit jamais dépendre des droits par défaut d'un projet.
grant execute on all functions in schema public to authenticated;

-- Fonctions de trigger : jamais appelables depuis l'API (le trigger s'exécute sans ce droit).
revoke execute on function public.handle_new_user()       from authenticated;
revoke execute on function public.purge_future_intakes()  from authenticated;
revoke execute on function public.auto_hide_reported()    from authenticated;

-- ---------- 2. Policies : réservées aux utilisateurs connectés ----------
-- (créées sans « to » par les migrations précédentes, elles visaient aussi anon.)
alter policy appt_delete                on public.appointments         to authenticated;
alter policy appt_insert                on public.appointments         to authenticated;
alter policy appt_select                on public.appointments         to authenticated;
alter policy appt_update                on public.appointments         to authenticated;
alter policy assignments_select         on public.care_assignments     to authenticated;
alter policy chatbot_usage_read         on public.chatbot_usage        to authenticated;
alter policy intakes_patient_write      on public.medication_intakes   to authenticated;
alter policy intakes_select             on public.medication_intakes   to authenticated;
alter policy mood_select                on public.mood_logs            to authenticated;
alter policy mood_write                 on public.mood_logs            to authenticated;
alter policy nnotes_insert              on public.nursing_notes        to authenticated;
alter policy nnotes_select              on public.nursing_notes        to authenticated;
alter policy rx_insert                  on public.prescriptions        to authenticated;
alter policy rx_select                  on public.prescriptions        to authenticated;
alter policy rx_update                  on public.prescriptions        to authenticated;
alter policy private_journal_owner      on public.private_journal      to authenticated;
alter policy profiles_select            on public.profiles             to authenticated;
alter policy profiles_select_care_team  on public.profiles             to authenticated;
alter policy profiles_update            on public.profiles             to authenticated;
alter policy symptoms_select            on public.symptom_logs         to authenticated;
alter policy symptoms_write             on public.symptom_logs         to authenticated;

-- ---------- 3. Une affectation ne compte que vers un vrai soignant ----------
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

-- ---------- 4. Prescriptions : patient et prescripteur ne changent jamais ----------
revoke update on public.prescriptions from authenticated;
grant update (medication, dosage, times_of_day, start_date, end_date, active)
  on public.prescriptions to authenticated;
