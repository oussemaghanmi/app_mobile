import { useAsync } from '@/lib/useAsync';
import { fetchIntakesBetween } from '@/features/medicaments/api';
import { fetchAppointmentsBetween } from './api';
import { addMonths, monthStart } from './month';

/** Prises et rendez-vous du mois affiché. */
export function useMonthData(month: Date, ready: boolean) {
  const from = monthStart(month);
  const to = addMonths(month, 1);
  const key = from.getTime();
  const intakes = useAsync(() => fetchIntakesBetween(from, to), [key, ready]);
  const appointments = useAsync(() => fetchAppointmentsBetween(from, to), [key]);
  return { intakes, appointments };
}
