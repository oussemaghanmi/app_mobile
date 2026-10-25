import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/auth/AuthProvider';

interface Intake { id: string; scheduled_at: string; status: 'pending' | 'taken' | 'skipped'; prescriptions: { medication: string; dosage: string } | null }

const MOODS = ['😣', '🙁', '😐', '🙂', '😄'];
const QUICK = [
  { to: 'disease', key: 'sections.disease' }, { to: 'recipes', key: 'sections.recipes' },
  { to: 'tips', key: 'sections.tips' }, { to: 'community', key: 'sections.community' },
  { to: 'journal', key: 'sections.journal' }, { to: 'calendar', key: 'sections.calendar' },
];
const today = () => new Date().toISOString().slice(0, 10);

/** Écran d'accueil — cahier des charges §1 */
export default function PatientHome() {
  const { t, i18n } = useTranslation();
  const { profile } = useAuth();
  const [mood, setMood] = useState<number | null>(null);
  const [intakes, setIntakes] = useState<Intake[]>([]);
  const [adherence, setAdherence] = useState<number | null>(null);
  const [tip, setTip] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end = new Date(start); end.setDate(end.getDate() + 1);

    supabase.from('medication_intakes')
      .select('id, scheduled_at, status, prescriptions(medication, dosage)')
      .gte('scheduled_at', start.toISOString()).lt('scheduled_at', end.toISOString())
      .order('scheduled_at')
      .then(({ data }) => setIntakes((data as unknown as Intake[]) ?? []));

    supabase.rpc('monthly_adherence').then(({ data }) => setAdherence(data as number | null));

    supabase.from('mood_logs').select('mood').eq('day', today()).maybeSingle()
      .then(({ data }) => setMood(data?.mood ?? null));

    supabase.from('tips').select('*').then(({ data }) => {
      if (!data?.length) return;
      const pick = data[new Date().getDate() % data.length];
      setTip(pick[profile.language] ?? pick.fr);
    });
  }, [profile]);

  const saveMood = async (value: number) => {
    setMood(value);
    await supabase.from('mood_logs').upsert({ patient_id: profile!.id, day: today(), mood: value });
  };

  const taken = intakes.filter((i) => i.status === 'taken').length;
  const next = intakes.find((i) => i.status === 'pending' && new Date(i.scheduled_at) >= new Date());
  const locale = i18n.language === 'tn' ? 'ar-TN' : i18n.language;
  const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex flex-col gap-4 p-4">
      <header>
        <h1 className="text-2xl">{t('home.hello', { name: profile?.first_name })}</h1>
        <p className="text-ink/60">
          {new Date().toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </header>

      <section className="card" aria-labelledby="mood-title">
        <h2 id="mood-title" className="mb-2">{t('home.mood')}</h2>
        <div className="flex justify-between" role="radiogroup">
          {MOODS.map((emoji, i) => (
            <button key={i} role="radio" aria-checked={mood === i + 1} aria-label={`${i + 1}/5`}
              onClick={() => saveMood(i + 1)}
              className={`h-12 w-12 rounded-full text-2xl ${mood === i + 1 ? 'bg-sage/20 ring-2 ring-sage' : ''}`}>
              {emoji}
            </button>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-2 gap-4">
        <section className="card">
          <p className="text-sm text-ink/60">{t('home.intakes')}</p>
          <p className="text-3xl font-bold text-sage-dark">{taken}/{intakes.length}</p>
        </section>
        <section className="card">
          <p className="text-sm text-ink/60">{t('home.adherence')}</p>
          <p className="text-3xl font-bold text-terracotta">{adherence ?? '–'}%</p>
        </section>
      </div>

      <section className="card">
        <p className="text-sm text-ink/60">{t('home.next')}</p>
        {next ? (
          <p className="text-lg font-medium">
            {next.prescriptions?.medication} {next.prescriptions?.dosage} — {fmtTime(next.scheduled_at)}
          </p>
        ) : <p>{t('home.none')}</p>}
      </section>

      <section aria-labelledby="quick-title">
        <h2 id="quick-title" className="mb-2">{t('home.quick')}</h2>
        <div className="grid grid-cols-3 gap-3">
          {QUICK.map((q) => (
            <Link key={q.to} to={q.to} className="card text-center text-sm font-medium">{t(q.key)}</Link>
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
