import { useTranslation } from 'react-i18next';

/** Écran temporaire — à remplacer par le composant exporté de Figma Make. */
export default function Placeholder({ titleKey }: { titleKey: string }) {
  const { t } = useTranslation();
  return (
    <section className="p-6">
      <h1 className="text-2xl">{t(titleKey)}</h1>
      <p className="mt-2 text-ink/60">TODO — migrer l'écran depuis src/figma/</p>
    </section>
  );
}
