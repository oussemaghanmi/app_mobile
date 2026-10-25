import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/features/auth/AuthProvider';
import { can } from '@/features/auth/permissions';
import { AsyncView } from '@/components/AsyncView';
import { useAssignedPatients } from '../hooks';

/** Tableau de bord Médecin / Infirmier : liste des patients affectés (filtrés par RLS). */
export default function ProDashboard() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const patients = useAssignedPatients(profile?.id);

  return (
    <div className="flex flex-col gap-4 p-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl">{t('pro.patients')}</h1>
        <Link to="settings" className="text-sm underline">
          {t('sections.settings')}
        </Link>
      </header>
      <AsyncView state={patients} isEmpty={(list) => list.length === 0} empty={t('pro.noPatients')}>
        {(list) => (
          <ul className="flex flex-col gap-3">
            {list.map((p) => (
              <li key={p.id} className="card">
                <p className="font-medium">
                  {p.first_name} {p.last_name}
                </p>
                <div className="mt-2 flex flex-wrap gap-2 text-sm">
                  <span className="rounded-full bg-sage/10 px-3 py-1">{t('pro.symptoms')}</span>
                  {can(profile?.role, 'prescriptions:write') && (
                    <span className="rounded-full bg-terracotta/10 px-3 py-1">{t('pro.prescriptions')}</span>
                  )}
                  {can(profile?.role, 'nursing_notes:write') && (
                    <span className="rounded-full bg-terracotta/10 px-3 py-1">{t('pro.nursingNotes')}</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </AsyncView>
    </div>
  );
}
