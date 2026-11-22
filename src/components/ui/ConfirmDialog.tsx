import { useEffect, useId, useRef } from 'react';
import { useTranslation } from 'react-i18next';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Boîte de dialogue accessible (role="alertdialog") pour les confirmations d'actions destructives.
 * - Piège le focus et le restitue à l'élément déclencheur à la fermeture.
 * - Fermeture possible avec la touche Échap ou clic hors de la modale.
 * - Boutons conformes aux cibles tactiles minimales de 44 px.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  danger = true,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { t } = useTranslation();
  const titleId = useId();
  const descId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelBtnRef = useRef<HTMLButtonElement>(null);
  const triggerElementRef = useRef<HTMLElement | null>(null);

  // Mémorisation de l'élément déclencheur et restitution du focus
  useEffect(() => {
    if (open) {
      triggerElementRef.current = document.activeElement as HTMLElement | null;
      const timer = setTimeout(() => {
        cancelBtnRef.current?.focus();
      }, 0);
      return () => clearTimeout(timer);
    } else if (triggerElementRef.current) {
      triggerElementRef.current.focus?.();
      triggerElementRef.current = null;
    }
  }, [open]);

  // Restitution au démontage si la boîte était ouverte
  useEffect(() => {
    return () => {
      if (triggerElementRef.current) {
        triggerElementRef.current.focus?.();
      }
    };
  }, []);

  // Fermeture sur Échap et piège à focus (Tab / Shift+Tab)
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
        return;
      }

      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  const resolvedConfirmLabel =
    confirmLabel ?? (danger ? t('common.delete', 'Supprimer') : t('common.confirm', 'Confirmer'));
  const resolvedCancelLabel = cancelLabel ?? t('common.cancel', 'Annuler');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="w-full max-w-md rounded-2xl bg-cream p-6 shadow-xl border border-terracotta/20 text-start"
      >
        <h2 id={titleId} className="text-lg font-bold font-serif text-ink">
          {title}
        </h2>
        <p id={descId} className="mt-2 text-sm text-ink/80 leading-relaxed">
          {description}
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
          <button
            ref={cancelBtnRef}
            type="button"
            onClick={onCancel}
            className="min-h-[44px] min-w-[44px] px-4 py-2 text-sm font-medium text-ink rounded-xl bg-ink/5 hover:bg-ink/10 transition-colors focus:ring-2 focus:ring-sage"
          >
            {resolvedCancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`min-h-[44px] min-w-[44px] px-4 py-2 text-sm font-medium rounded-xl text-white transition-colors focus:ring-2 ${
              danger
                ? 'bg-terracotta-dark hover:brightness-90 focus:ring-terracotta'
                : 'bg-sage-dark hover:brightness-90 focus:ring-sage'
            }`}
          >
            {resolvedConfirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
export default ConfirmDialog;
