import { useTranslation } from 'react-i18next';

/** Écran temporaire, remplacé au fur et à mesure de la construction des écrans. */
export default function Placeholder({ titleKey }: { titleKey: string }) {
  const { t } = useTranslation();
  return (
    <section className="p-6">
      <h1 className="text-2xl">{t(titleKey)}</h1>
      <p className="mt-2 text-ink/60">{t('placeholder.soon')}</p>
    </section>
  );
}
