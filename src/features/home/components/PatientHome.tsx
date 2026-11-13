import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/features/auth/AuthProvider';
import { usePatientContext } from '@/components/PatientLayout';
import { usePatientHome } from '../hooks';

const MOODS = ['😣', '🙁', '😐', '🙂', '😄'];
const QUICK = [
  { to: 'disease', key: 'sections.disease' },
  { to: 'recipes', key: 'sections.recipes' },
  { to: 'tips', key: 'sections.tips' },
  { to: 'community', key: 'sections.community' },
  { to: 'journal', key: 'sections.journal' },
  { to: 'calendar', key: 'sections.calendar' },
];
/** Écran d'accueil — cahier des charges §1 */
export default function PatientHome() {
  const { t, i18n } = useTranslation();
  const { profile } = useAuth();
  const { intakesReady } = usePatientContext();
  const { mood, saveMood, intakes, adherence, tip, markTaken } = usePatientHome(profile, intakesReady);
  const [marking, setMarking] = useState(false);
  const [markError, setMarkError] = useState(false);

  const taken = intakes.filter((i) => i.status === 'taken').length;
  // Prochaine prise = la première prise du jour pas encore cochée (y compris une prise en retard).
  const next = intakes.find((i) => i.status === 'pending');
  const isLate = !!next && new Date(next.scheduled_at) < new Date();

  const onMarkTaken = async () => {
    if (!next) return;
    setMarking(true);
    setMarkError(false);
    try {
      await markTaken(next.id);
    } catch {
      setMarkError(true);
    } finally {
      setMarking(false);
    }
  };
  const locale = i18n.language === 'tn' ? 'ar-TN' : i18n.language;
  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex flex-col gap-4 p-4">
      <header>
        <h1 className="text-2xl">{t('home.hello', { name: profile?.first_name })}</h1>
        <p className="text-ink/60">
          {new Date().toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </header>

      <section className="card" aria-labelledby="mood-title">
        <h2 id="mood-title" className="mb-2">
          {t('home.mood')}
        </h2>
        <div className="flex justify-between" role="radiogroup">
          {MOODS.map((emoji, i) => (
            <button
              key={i}
              role="radio"
              aria-checked={mood === i + 1}
              aria-label={`${i + 1}/5`}
              onClick={() => saveMood(i + 1)}
              className={`h-12 w-12 rounded-full text-2xl ${mood === i + 1 ? 'bg-sage/20 ring-2 ring-sage' : ''}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-2 gap-4">
        <section className="card">
          <p className="text-sm text-ink/60">{t('home.intakes')}</p>
          <p className="text-3xl font-bold text-sage-dark">
            {taken}/{intakes.length}
          </p>
        </section>
        <section className="card">
          <p className="text-sm text-ink/60">{t('home.adherence')}</p>
          <p className="text-3xl font-bold text-terracotta">{adherence ?? '–'}%</p>
        </section>
      </div>

      <section className="card">
        <p className="text-sm text-ink/60">{t('home.next')}</p>
        {next ? (
          <div className="flex items-center justify-between gap-3">
            <p className="text-lg font-medium">
              {next.prescriptions?.medication} {next.prescriptions?.dosage} — {fmtTime(next.scheduled_at)}
              {isLate && (
                <span className="ms-2 rounded-full bg-terracotta/10 px-2 py-0.5 text-xs text-terracotta">
                  {t('home.late')}
                </span>
              )}
            </p>
            <button
              className="btn min-h-11 shrink-0"
              onClick={onMarkTaken}
              disabled={marking}
              aria-label={t('home.markTakenLabel', { name: next.prescriptions?.medication ?? '' })}
            >
              ✓ {t('home.markTaken')}
            </button>
          </div>
        ) : (
          <p>{t('home.none')}</p>
        )}
        {markError && (
          <p role="alert" className="mt-2 text-sm text-terracotta">
            {t('home.markError')}
          </p>
        )}
      </section>

      <section aria-labelledby="quick-title">
        <h2 id="quick-title" className="mb-2">
          {t('home.quick')}
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {QUICK.map((q) => (
            <Link key={q.to} to={q.to} className="card text-center text-sm font-medium">
              {t(q.key)}
            </Link>
          ))}
        </div>
      </section>

      {tip && (
        <section className="card border-s-4 border-terracotta">
          <p className="text-sm text-ink/60">{t('home.tip')}</p>
          <p>{tip}</p>
        </section>
      )}
    </div>
  );
}
