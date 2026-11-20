import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/auth/AuthProvider';
import { can } from '@/auth/permissions';

interface Patient { id: string; first_name: string; last_name: string }

/** Tableau de bord Médecin / Infirmier : liste des patients affectés (filtrés par RLS). */
export default function ProDashboard() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);

  useEffect(() => {
    if (!profile) return;
    supabase.from('care_assignments')
      .select('patient:profiles!care_assignments_patient_id_fkey(id, first_name, last_name)')
      .eq('professional_id', profile.id)
      .then(({ data }) => setPatients((data ?? []).map((r) => r.patient as unknown as Patient)));
  }, [profile]);

  return (
    <div className="flex flex-col gap-4 p-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl">{t('pro.patients')}</h1>
        <Link to="settings" className="text-sm underline">{t('sections.settings')}</Link>
      </header>
      {patients.length === 0 && <p className="text-ink/60">{t('pro.noPatients')}</p>}
      <ul className="flex flex-col gap-3">
        {patients.map((p) => (
          <li key={p.id} className="card">
            <p className="font-medium">{p.first_name} {p.last_name}</p>
            <div className="mt-2 flex flex-wrap gap-2 text-sm">
              <span className="rounded-full bg-sage/10 px-3 py-1">{t('pro.symptoms')}</span>
              {can(profile?.role, 'prescriptions:write') && (
                <span className="rounded-full bg-terracotta/10 px-3 py-1">{t('pro.prescriptions')}</span>)}
              {can(profile?.role, 'nursing_notes:write') && (
                <span className="rounded-full bg-terracotta/10 px-3 py-1">{t('pro.nursingNotes')}</span>)}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
