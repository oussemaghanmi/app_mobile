// Les tests vérifient les textes français (langue par défaut). jsdom se présente comme un navigateur
// anglais (navigator.language = 'en-US') : sans choix mémorisé, i18n démarrerait en anglais (#112).
// Importé AVANT '@/i18n' dans setup.ts pour mémoriser « fr » comme si la personne l'avait choisi.
localStorage.setItem('croncare.lang', 'fr');
