import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Profile } from '@/features/auth/types';
import * as api from './api';
import { markIntakeTaken } from '@/features/medicaments/api';
import { cancelReminder } from '@/features/rappels/notifications';
import type { TodayIntake } from './types';

/** Données de l'écran d'accueil patient (prises du jour, observance, humeur, conseil). */
export function usePatientHome(profile: Profile | null, intakesReady = true) {
  const [mood, setMood] = useState<number | null>(null);
  const [intakes, setIntakes] = useState<TodayIntake[]>([]);
  const [adherence, setAdherence] = useState<number | null>(null);
  const [tips, setTips] = useState<Awaited<ReturnType<typeof api.fetchTips>>>([]);
  const { i18n } = useTranslation();

  useEffect(() => {
    if (!profile || !intakesReady) return;
    const ignore = () => undefined;
    api.fetchTodayIntakes().then(setIntakes, ignore);
    api.fetchMonthlyAdherence().then(setAdherence, ignore);
    api.fetchTodayMood().then(setMood, ignore);
    api.fetchTips().then(setTips, ignore);
  }, [profile, intakesReady]);

  // Conseil du jour dans la langue de l'interface (comme l'écran Conseils), pas celle du profil.
  const pick = tips.length ? tips[new Date().getDate() % tips.length] : null;
  const tip = pick ? pick[i18n.language as 'fr' | 'en' | 'ar' | 'tn'] || pick.fr : null;

  const saveMood = async (value: number) => {
    if (!profile) return;
    setMood(value);
    await api.saveMood(profile.id, value);
  };

  /** Bouton « Pris » : mise à jour optimiste puis rafraîchissement de l'observance. */
  const markTaken = async (intakeId: string) => {
    const previous = intakes;
    setIntakes((list) => list.map((i) => (i.id === intakeId ? { ...i, status: 'taken' } : i)));
    try {
      await markIntakeTaken(intakeId);
      cancelReminder(intakeId).catch(() => undefined);
      setAdherence(await api.fetchMonthlyAdherence());
    } catch {
      setIntakes(previous);
      throw new Error('mark-taken-failed');
    }
  };

  return { mood, saveMood, intakes, adherence, tip, markTaken };
}
