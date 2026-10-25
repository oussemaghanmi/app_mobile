import { NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const TABS = [
  { to: '/patient', key: 'sections.home', icon: '⌂', end: true },
  { to: '/patient/meds', key: 'sections.meds', icon: '💊' },
  { to: '/patient/journal', key: 'sections.journal', icon: '✎' },
  { to: '/patient/community', key: 'sections.community', icon: '☺' },
  { to: '/patient/settings', key: 'sections.settings', icon: '⚙' },
];

/** Navigation basse accessible (libellés visibles + aria-current via NavLink). */
export default function PatientLayout() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-full flex-col">
      <main className="flex-1 pb-24">
        <Outlet />
      </main>
      <nav
        aria-label="Navigation principale"
        className="fixed inset-x-0 bottom-0 flex justify-around border-t border-black/5 bg-white pb-[env(safe-area-inset-bottom)]"
      >
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              `flex min-h-14 min-w-14 flex-col items-center justify-center text-xs ${isActive ? 'text-sage-dark font-bold' : 'text-ink/60'}`
            }
          >
            <span aria-hidden className="text-lg">
              {tab.icon}
            </span>
            {t(tab.key)}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
