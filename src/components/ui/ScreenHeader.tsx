import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface Props {
  title: string;
  subtitle?: string;
  /** Lien de retour (par défaut : accueil patient). `null` pour le masquer. */
  backTo?: string | null;
  action?: ReactNode;
}

/** En-tête d'écran : retour (flèche orientée selon la direction), titre H1, action optionnelle. */
export function ScreenHeader({ title, subtitle, backTo = '/patient', action }: Props) {
  const { t } = useTranslation();
  return (
    <header className="flex items-start gap-2">
      {backTo !== null && (
        <Link
          to={backTo}
          aria-label={t('common.back')}
          className="-ms-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl text-sage-dark active:bg-sage/10"
        >
          <span aria-hidden className="rtl:rotate-180">
            ←
          </span>
        </Link>
      )}
      <div className="min-w-0 flex-1 pt-1.5">
        <h1 className="text-2xl">{title}</h1>
        {subtitle && <p className="text-sm text-ink/60">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}
