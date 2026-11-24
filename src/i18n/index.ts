import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import fr from './locales/fr.json';
import en from './locales/en.json';
import ar from './locales/ar.json';
import tn from './locales/tn.json';

export const LANGUAGES = [
  { code: 'fr', label: 'Français', rtl: false },
  { code: 'en', label: 'English', rtl: false },
  { code: 'ar', label: 'العربية', rtl: true },
  { code: 'tn', label: 'تونسي (Darija)', rtl: true },
] as const;
export type LangCode = (typeof LANGUAGES)[number]['code'];

const STORAGE_KEY = 'croncare.lang';
const saved = (() => {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
})();

/**
 * Langue de départ : le choix mémorisé s'il est valide ; sinon, à la première ouverture, la première langue
 * du navigateur ou du téléphone parmi fr, en, ar (« ar-TN » donne « ar ») ; sinon fr.
 * Le darija (tn) n'est jamais choisi automatiquement : aucun réglage ne le désigne (#112).
 */
export function initialLanguage(stored: string | null, browserLanguages: readonly string[]): LangCode {
  if (LANGUAGES.some((l) => l.code === stored)) return stored as LangCode;
  for (const tag of browserLanguages) {
    const primary = tag.toLowerCase().split('-')[0];
    if (primary === 'fr' || primary === 'en' || primary === 'ar') return primary;
  }
  return 'fr';
}

const browserLanguages = (() => {
  try {
    return navigator.languages?.length ? navigator.languages : [navigator.language];
  } catch {
    return [];
  }
})();
const startLanguage = initialLanguage(saved, browserLanguages);

i18n.use(initReactI18next).init({
  resources: {
    fr: { translation: fr },
    en: { translation: en },
    ar: { translation: ar },
    tn: { translation: tn },
  },
  lng: startLanguage,
  fallbackLng: 'fr',
  interpolation: { escapeValue: false },
});

/** Applique la langue + la direction (RTL pour arabe et darija) sur <html>. */
export function applyLanguage(code: LangCode) {
  const rtl = LANGUAGES.find((l) => l.code === code)?.rtl ?? false;
  document.documentElement.lang = code === 'tn' ? 'ar-TN' : code;
  document.documentElement.dir = rtl ? 'rtl' : 'ltr';
  try {
    localStorage.setItem(STORAGE_KEY, code);
  } catch {
    /* stockage indisponible */
  }
  return i18n.changeLanguage(code);
}

applyLanguage(startLanguage);

export default i18n;
