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

i18n.use(initReactI18next).init({
  resources: {
    fr: { translation: fr },
    en: { translation: en },
    ar: { translation: ar },
    tn: { translation: tn },
  },
  lng: saved ?? 'fr',
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

applyLanguage((saved as LangCode) ?? 'fr');

export default i18n;
