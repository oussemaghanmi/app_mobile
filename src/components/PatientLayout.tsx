import { NavLink, Outlet, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useIntakeGeneration } from '@/features/medicaments/hooks';
import { useMedicationReminders } from '@/features/rappels/hooks';
import { useAuth } from '@/features/auth/AuthProvider';
import { Icon, type IconName } from '@/components/ui/Icon';

export interface PatientOutletContext {
  /** Vrai une fois les prises des prochains jours générées. */
  intakesReady: boolean;
}

/** Contexte partagé par les écrans de l'espace patient. */
// eslint-disable-next-line react-refresh/only-export-components
export const usePatientContext = () => useOutletContext<PatientOutletContext>();

const TABS: { to: string; key: string; icon: IconName; end?: boolean }[] = [
  { to: '/patient', key: 'sections.home', icon: 'home', end: true },
  { to: '/patient/meds', key: 'sections.meds', icon: 'pill' },
  { to: '/patient/journal', key: 'sections.journal', icon: 'journal' },
  { to: '/patient/community', key: 'sections.community', icon: 'community' },
  { to: '/patient/settings', key: 'sections.settings', icon: 'settings' },
];

/**
 * Navigation basse accessible (libellés visibles + aria-current via NavLink).
 * Génère aussi les prises à venir à l'ouverture de l'espace patient et programme les rappels.
 */
export default function PatientLayout() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const intakesReady = useIntakeGeneration(true);
  useMedicationReminders(profile, intakesReady);
  return (
    <div className="flex min-h-full flex-col">
      <main className="flex-1 pb-24">
        <Outlet context={{ intakesReady } satisfies PatientOutletContext} />
      </main>
      <nav
        aria-label={t('nav.main')}
        className="fixed inset-x-0 bottom-0 flex justify-around border-t border-black/5 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_12px_rgba(47,58,51,0.06)] backdrop-blur"
      >
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              `group flex min-h-16 min-w-16 flex-1 flex-col items-center justify-center gap-0.5 text-xs ${isActive ? 'font-bold text-sage-dark' : 'text-ink/70'}`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`flex h-8 w-14 items-center justify-center rounded-full transition-colors ${isActive ? 'bg-sage/20' : ''}`}
                >
                  <Icon name={tab.icon} className="h-6 w-6" />
                </span>
                {t(tab.key)}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
