import { useEffect, useState } from 'react';
import type { Profile } from '@/features/auth/types';
import * as api from './api';
import { markIntakeTaken } from '@/features/medicaments/api';
import type { TodayIntake } from './types';

/** Données de l'écran d'accueil patient (prises du jour, observance, humeur, conseil). */
export function usePatientHome(profile: Profile | null, intakesReady = true) {
  const [mood, setMood] = useState<number | null>(null);
  const [intakes, setIntakes] = useState<TodayIntake[]>([]);
  const [adherence, setAdherence] = useState<number | null>(null);
  const [tip, setTip] = useState<string | null>(null);

  useEffect(() => {
    if (!profile || !intakesReady) return;
    const ignore = () => undefined;
    api.fetchTodayIntakes().then(setIntakes, ignore);
    api.fetchMonthlyAdherence().then(setAdherence, ignore);
    api.fetchTodayMood().then(setMood, ignore);
    api.fetchTips().then((tips) => {
      if (!tips.length) return;
      const pick = tips[new Date().getDate() % tips.length];
      setTip(pick[profile.language as 'fr' | 'en' | 'ar' | 'tn'] ?? pick.fr);
    }, ignore);
  }, [profile, intakesReady]);

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
      setAdherence(await api.fetchMonthlyAdherence());
    } catch {
      setIntakes(previous);
      throw new Error('mark-taken-failed');
    }
  };

  return { mood, saveMood, intakes, adherence, tip, markTaken };
}
