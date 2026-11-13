import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

export interface Reminder {
  /** Identifiant de la prise (uuid). */
  intakeId: string;
  at: Date;
  title: string;
  body: string;
}

export type ReminderPermission = 'granted' | 'denied' | 'prompt' | 'unsupported';

/** Les rappels locaux n'existent que dans l'application native (Android / iOS). */
export const remindersSupported = () => Capacitor.isNativePlatform();

/** Identifiant de notification entier (int32 positif) stable, dérivé de l'uuid de la prise. */
export function notificationId(uuid: string): number {
  let h = 0;
  for (let i = 0; i < uuid.length; i++) h = (Math.imul(31, h) + uuid.charCodeAt(i)) | 0;
  return Math.abs(h) || 1;
}

export async function checkPermission(): Promise<ReminderPermission> {
  if (!remindersSupported()) return 'unsupported';
  const { display } = await LocalNotifications.checkPermissions();
  return display === 'granted' ? 'granted' : display === 'denied' ? 'denied' : 'prompt';
}

export async function requestPermission(): Promise<ReminderPermission> {
  if (!remindersSupported()) return 'unsupported';
  const { display } = await LocalNotifications.requestPermissions();
  return display === 'granted' ? 'granted' : display === 'denied' ? 'denied' : 'prompt';
}

/** Annule tous les rappels programmés par l'application. */
export async function cancelAllReminders(): Promise<void> {
  if (!remindersSupported()) return;
  const { notifications } = await LocalNotifications.getPending();
  if (notifications.length) {
    await LocalNotifications.cancel({ notifications: notifications.map((n) => ({ id: n.id })) });
  }
}

/**
 * Remplace l'ensemble des rappels programmés par `reminders` (seuls ceux dans le futur sont gardés).
 * Renvoie le nombre de rappels programmés, ou -1 si non disponible / non autorisé.
 */
export async function replaceReminders(reminders: Reminder[], now = new Date()): Promise<number> {
  if (!remindersSupported()) return -1;
  if ((await checkPermission()) !== 'granted') return -1;
  await cancelAllReminders();
  const future = reminders.filter((r) => r.at > now);
  if (!future.length) return 0;
  await LocalNotifications.schedule({
    notifications: future.map((r) => ({
      id: notificationId(r.intakeId),
      title: r.title,
      body: r.body,
      schedule: { at: r.at, allowWhileIdle: true },
      extra: { intakeId: r.intakeId },
    })),
  });
  return future.length;
}

/** Annule le rappel d'une prise (après « Pris »). */
export async function cancelReminder(intakeId: string): Promise<void> {
  if (!remindersSupported()) return;
  await LocalNotifications.cancel({ notifications: [{ id: notificationId(intakeId) }] });
}
