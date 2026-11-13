import { useTranslation } from 'react-i18next';

/** Rappel permanent : contenu général, ne remplace pas un avis médical. */
export function MedicalNotice({ className = '' }: { className?: string }) {
  const { t } = useTranslation();
  return (
    <p role="note" className={`rounded-xl bg-sage/10 px-3 py-2 text-sm text-ink/80 ${className}`}>
      <span aria-hidden>ℹ️ </span>
      {t('common.medicalNotice')}
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
      <h2 id="emergency-title" className="text-lg text-terracotta">
        <span aria-hidden>⚠️ </span>
        {t('emergency.title')}
      </h2>
      {/* TODO(validation-médicale) : liste des signes d'alerte */}
      <ul className="mt-2 list-disc space-y-1 ps-5 text-sm">
        {(['blood', 'fever', 'pain', 'vomiting', 'dehydration'] as const).map((k) => (
          <li key={k}>{t(`emergency.signs.${k}`)}</li>
        ))}
      </ul>
      <a href="tel:190" className="btn mt-3 flex min-h-12 items-center justify-center gap-2 bg-terracotta">
        <span aria-hidden>📞</span>
        {t('emergency.call')}
      </a>
    </section>
  );
}
