import { useTranslation } from 'react-i18next';
import { Icon } from './Icon';

/** Rappel permanent : contenu général, ne remplace pas un avis médical. */
export function MedicalNotice({ className = '' }: { className?: string }) {
  const { t } = useTranslation();
  return (
    <p role="note" className={`flex gap-2 rounded-xl bg-sage/10 px-3 py-2 text-sm text-ink/80 ${className}`}>
      <Icon name="info" className="mt-0.5 h-4 w-4 shrink-0 text-sage-dark" />
      <span>{t('common.medicalNotice')}</span>
    </p>
  );
}

/** Encadré « signes d'alerte » avec appel du SAMU (190). */
export function EmergencyNotice() {
  const { t } = useTranslation();
  return (
    <section
      aria-labelledby="emergency-title"
      className="rounded-2xl border-2 border-terracotta bg-terracotta/5 p-4"
    >
      <h2 id="emergency-title" className="flex items-center gap-2 text-lg text-terracotta-dark">
        <Icon name="alert" className="h-5 w-5 shrink-0" />
        {t('emergency.title')}
      </h2>
      {/* TODO(validation-médicale) : liste des signes d'alerte */}
      <ul className="mt-2 list-disc space-y-1 ps-5 text-sm">
        {(['blood', 'fever', 'pain', 'vomiting', 'dehydration'] as const).map((k) => (
          <li key={k}>{t(`emergency.signs.${k}`)}</li>
        ))}
      </ul>
      <a
        href="tel:190"
        className="btn mt-3 flex min-h-12 items-center justify-center gap-2 bg-terracotta-dark"
      >
        <Icon name="phone" className="h-5 w-5" />
        {t('emergency.call')}
      </a>
    </section>
  );
}
