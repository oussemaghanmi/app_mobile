import { useTranslation } from 'react-i18next';
import { applyLanguage, LANGUAGES } from '@/i18n';

/**
 * Choix de la langue sur les écrans publics (connexion, inscription, mot de passe), avant toute connexion.
 * Chaque langue est écrite dans sa propre langue ; la langue affichée est annoncée (aria-pressed).
 * Le profil Supabase n'est pas modifié ici : il n'existe pas encore (voir Paramètres après connexion).
 */
export function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  return (
    <div role="group" aria-label={t('settings.language')} className="flex flex-wrap justify-center gap-2">
      {LANGUAGES.map((l) => {
        const active = i18n.language === l.code;
        return (
          <button
            key={l.code}
            type="button"
            lang={l.code === 'tn' ? 'ar-TN' : l.code}
            aria-pressed={active}
            onClick={() => applyLanguage(l.code)}
            className={`min-h-11 rounded-full border px-3 text-sm ${
              active
                ? 'border-sage-dark bg-sage/15 font-bold text-sage-dark'
                : 'border-ink/20 bg-white text-ink'
            }`}
          >
            {l.label}
          </button>
        );
      })}
    </div>
  );
}
