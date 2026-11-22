import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { AsyncState } from '@/lib/useAsync';

interface Props<T> {
  state: AsyncState<T>;
  /** Vrai si les données sont considérées comme vides (liste vide, etc.). */
  isEmpty?: (data: T) => boolean;
  empty?: ReactNode;
  children: (data: T) => ReactNode;
}

/** Affiche de façon homogène les états chargement / erreur / vide / données. */
export function AsyncView<T>({ state, isEmpty, empty, children }: Props<T>) {
  const { t } = useTranslation();
  if (state.loading && state.data === undefined) {
    return (
      <p role="status" aria-live="polite" className="p-4 text-center text-ink/60">
        {t('common.loading')}
      </p>
    );
  }
  if (state.error) {
    return (
      <div role="alert" className="card flex flex-col items-center gap-2 text-center">
        <p>{t('common.error')}</p>
        <button className="btn min-h-11" onClick={state.reload}>
          {t('common.retry')}
        </button>
      </div>
    );
  }
  if (state.data === undefined) return null;
  if (isEmpty?.(state.data)) {
    return <p className="p-4 text-center text-ink/60">{empty ?? t('common.empty')}</p>;
  }
  return <>{children(state.data)}</>;
}
