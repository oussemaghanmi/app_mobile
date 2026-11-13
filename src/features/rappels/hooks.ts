import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { Profile } from '@/features/auth/types';
import { fetchIntakesBetween, INTAKE_HORIZON_DAYS } from '@/features/medicaments/api';
import { cancelAllReminders, remindersSupported, replaceReminders, requestPermission } from './notifications';

/**
 * Programme une notification locale par prise en attente des 7 prochains jours.
 * Reprogramme à l'ouverture, au retour au premier plan (prescriptions modifiées entre-temps),
 * au changement de langue et quand `notif_meds` change. Sur le web : ne fait rien.
 */
export function useMedicationReminders(profile: Profile | null, intakesReady: boolean) {
  const { t, i18n } = useTranslation();
  const enabled = !!profile && profile.role === 'patient' && profile.notif_meds;

  useEffect(() => {
    if (!remindersSupported() || !profile || !intakesReady) return;
    let alive = true;

    const sync = async () => {
      try {
        if (!enabled) return void (await cancelAllReminders());
        if ((await requestPermission()) !== 'granted') return;
        const now = new Date();
        const until = new Date(now.getTime() + INTAKE_HORIZON_DAYS * 24 * 3600_000);
        const intakes = await fetchIntakesBetween(now, until);
        if (!alive) return;
        await replaceReminders(
          intakes
            .filter((i) => i.status === 'pending')
            .map((i) => ({
              intakeId: i.id,
              at: new Date(i.scheduled_at),
              title: t('reminders.title'),
              body: t('reminders.body', {
                medication: i.prescriptions?.medication ?? '',
                dosage: i.prescriptions?.dosage ?? '',
              }),
            })),
        );
      } catch {
        // Un échec de programmation ne doit jamais bloquer l'application.
      }
    };

    sync();
    const onVisible = () => document.visibilityState === 'visible' && sync();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      alive = false;
      document.removeEventListener('visibilitychange', onVisible);
    };
    // t change avec la langue : les textes des notifications sont alors reprogrammés.
  }, [enabled, intakesReady, profile, t, i18n.language]);
}
