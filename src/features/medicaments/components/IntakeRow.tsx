import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/ui/Icon';
import { displayStatus } from '../status';
import type { DisplayStatus, Intake } from '../types';

const BADGE: Record<DisplayStatus, string> = {
  taken: 'bg-sage/15 text-sage-dark',
  skipped: 'bg-ink/10 text-ink/70',
  missed: 'bg-terracotta/15 text-terracotta-dark',
  late: 'bg-terracotta/10 text-terracotta-dark',
  upcoming: 'bg-cream text-ink/70',
};

interface Props {
  intake: Intake;
  locale: string;
  /** Si fourni, affiche le bouton « Pris » pour les prises non cochées. */
  onTake?: (id: string) => Promise<void>;
}

/** Ligne de prise : heure, médicament, statut et bouton « Pris ». */
export function IntakeRow({ intake, locale, onTake }: Props) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const status = displayStatus(intake);
  const time = new Date(intake.scheduled_at).toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  });
  const canTake = onTake && intake.status === 'pending';

  const take = async () => {
    setBusy(true);
    setError(false);
    try {
      await onTake!(intake.id);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className="flex flex-col gap-1 py-2">
      <div className="flex items-start gap-3">
        <span className="min-w-14 shrink-0 pt-0.5 font-medium whitespace-nowrap tabular-nums">{time}</span>
        {/* Le nom n'est jamais tronqué (#100) : il passe à la ligne ; le statut est placé dessous. */}
        <div className="min-w-0 flex-1">
          {/* <bdi> : un nom ou un dosage saisi en français reste dans le bon ordre en arabe (« 1 comprimé »). */}
          <p className="font-medium break-words">
            <bdi>{intake.prescriptions?.medication}</bdi>
          </p>
          <p className="text-sm text-ink/70">
            <bdi>{intake.prescriptions?.dosage}</bdi>
          </p>
          <span className={`mt-1 inline-block rounded-full px-2 py-1 text-xs font-medium ${BADGE[status]}`}>
            {t(`meds.status.${status}`)}
          </span>
        </div>
        {canTake ? (
          <button
            className="btn min-h-11 shrink-0 px-3"
            onClick={take}
            disabled={busy}
            aria-label={t('home.markTakenLabel', { name: intake.prescriptions?.medication ?? '' })}
          >
            <Icon name="check" className="me-1 inline h-5 w-5 align-[-4px]" />
            {t('home.markTaken')}
          </button>
        ) : null}
      </div>
      {error && (
        <p role="alert" className="text-sm text-terracotta-dark">
          {t('home.markError')}
        </p>
      )}
    </li>
  );
}
