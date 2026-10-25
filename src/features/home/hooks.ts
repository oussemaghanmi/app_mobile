import { useEffect, useState } from 'react';
import type { Profile } from '@/features/auth/types';
import * as api from './api';
import type { TodayIntake } from './types';

/** Données de l'écran d'accueil patient (prises du jour, observance, humeur, conseil). */
export function usePatientHome(profile: Profile | null) {
  const [mood, setMood] = useState<number | null>(null);
  const [intakes, setIntakes] = useState<TodayIntake[]>([]);
  const [adherence, setAdherence] = useState<number | null>(null);
  const [tip, setTip] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    const ignore = () => undefined;
    api.fetchTodayIntakes().then(setIntakes, ignore);
    api.fetchMonthlyAdherence().then(setAdherence, ignore);
    api.fetchTodayMood().then(setMood, ignore);
    api.fetchTips().then((tips) => {
      if (!tips.length) return;
      const pick = tips[new Date().getDate() % tips.length];
      setTip(pick[profile.language as 'fr' | 'en' | 'ar' | 'tn'] ?? pick.fr);
    }, ignore);
  }, [profile]);

  const saveMood = async (value: number) => {
    if (!profile) return;
    setMood(value);
    await api.saveMood(profile.id, value);
  };

  return { mood, saveMood, intakes, adherence, tip };
}
