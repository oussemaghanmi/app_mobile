import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { MedicalNotice } from '@/components/ui/MedicalNotice';
import { AsyncView } from '@/components/AsyncView';
import type { Language } from '@/features/auth/types';
import { useTips } from '../hooks';
import type { Tip } from '../api';

const ICONS: Record<string, string> = {
  hydratation: '💧',
  tabac: '🚭',
  sommeil: '🌙',
  stress: '🧘',
  activite: '🚶',
  voyage: '🧳',
  alimentation: '🥗',
  suivi: '🩺',
};

// TODO(validation-médicale) : textes tips.tobacco.* (carte prioritaire) à faire relire.
const TOBACCO_STEPS = ['date', 'triggers', 'entourage', 'help'] as const;

/** Écran Conseils : carte prioritaire arrêt du tabac puis conseils de vie par thème. */
export default function TipsScreen() {
  const { t, i18n } = useTranslation();
  const tips = useTips();
  const lang = i18n.language as Language;
  const text = (tip: Tip) => tip[lang] || tip.fr;

  return (
    <div className="flex flex-col gap-4 p-4">
      <ScreenHeader title={t('sections.tips')} subtitle={t('tips.subtitle')} />

      <section aria-labelledby="tobacco-title" className="card border-s-4 border-terracotta bg-terracotta/5">
        <p className="text-xs font-bold tracking-wide text-terracotta uppercase">{t('tips.priority')}</p>
        <h2 id="tobacco-title" className="mt-1 text-xl">
          <span aria-hidden>🚭 </span>
          {t('tips.tobacco.title')}
        </h2>
        <p className="mt-1 leading-relaxed text-ink/80">{t('tips.tobacco.intro')}</p>
        <ol className="mt-3 flex flex-col gap-2">
          {TOBACCO_STEPS.map((k, i) => (
            <li key={k} className="flex gap-3">
              <span
                aria-hidden
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-terracotta text-sm font-bold text-white"
              >
                {i + 1}
              </span>
              <p className="text-sm leading-relaxed">
                <strong>{t(`tips.tobacco.${k}.title`)}</strong> — {t(`tips.tobacco.${k}.text`)}
              </p>
            </li>
          ))}
        </ol>
        <Link
          to="/patient/disease"
          className="mt-3 inline-flex min-h-11 items-center text-sm font-medium text-terracotta underline"
        >
          {t('tips.tobacco.more')}
        </Link>
      </section>

      <MedicalNotice />

      <AsyncView state={tips} isEmpty={(l) => l.length === 0}>
        {(list) => (
          <ul className="flex flex-col gap-3">
            {list.map((tip) => (
              <li key={tip.id} className="card flex gap-3">
                <span aria-hidden className="text-2xl">
                  {ICONS[tip.category] ?? '💡'}
                </span>
                <div>
                  <p className="text-xs font-medium text-sage-dark">{t(`tips.category.${tip.category}`)}</p>
                  <p className="leading-relaxed">{text(tip)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </AsyncView>
    </div>
  );
}
