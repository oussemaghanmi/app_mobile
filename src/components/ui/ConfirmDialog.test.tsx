import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { ConfirmDialog } from './ConfirmDialog';

function TestHost() {
  const [open, setOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  return (
    <div>
      <button data-testid="trigger" onClick={() => setOpen(true)}>
        Ouvrir
      </button>
      <ConfirmDialog
        open={open}
        title="Titre alerte"
        description="Description alerte"
        confirmLabel="Confirmer action"
        cancelLabel="Annuler action"
        onConfirm={() => {
          setConfirmed(true);
          setOpen(false);
        }}
        onCancel={() => setOpen(false)}
      />
      {confirmed && <p data-testid="confirmed-state">Action confirmée</p>}
    </div>
  );
}

describe('<ConfirmDialog />', () => {
  it("s'affiche avec role alertdialog, titre et description liés", () => {
    render(
      <ConfirmDialog
        open={true}
        title="Supprimer la note"
        description="Cette note sera supprimée."
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    const dialog = screen.getByRole('alertdialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByText('Supprimer la note')).toBeInTheDocument();
    expect(screen.getByText('Cette note sera supprimée.')).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-labelledby');
    expect(dialog).toHaveAttribute('aria-describedby');
  });

  it("ne rend rien quand open est faux", () => {
    render(
      <ConfirmDialog
        open={false}
        title="Supprimer la note"
        description="Cette note sera supprimée."
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it("appelle onCancel au clic sur annuler", async () => {
    const onCancel = vi.fn();
    render(
      <ConfirmDialog
        open={true}
        title="Attention"
        description="Êtes-vous sûr ?"
        cancelLabel="Annuler"
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("appelle onConfirm au clic sur le bouton de confirmation", async () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog
        open={true}
        title="Attention"
        description="Êtes-vous sûr ?"
        confirmLabel="Supprimer définitivement"
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Supprimer définitivement' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("ferme le dialogue à l'appui sur Échap", async () => {
    const onCancel = vi.fn();
    render(
      <ConfirmDialog
        open={true}
        title="Attention"
        description="Êtes-vous sûr ?"
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />,
    );

    await userEvent.keyboard('{Escape}');
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("piège le focus dans la boîte de dialogue", async () => {
    render(
      <ConfirmDialog
        open={true}
        title="Attention"
        description="Êtes-vous sûr ?"
        confirmLabel="Confirmer"
        cancelLabel="Annuler"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    const cancelBtn = screen.getByRole('button', { name: 'Annuler' });
    const confirmBtn = screen.getByRole('button', { name: 'Confirmer' });

    // Focus initial sur le bouton Annuler
    await waitFor(() => expect(cancelBtn).toHaveFocus());

    // Tab -> Confirm button
    await userEvent.tab();
    expect(confirmBtn).toHaveFocus();

    // Tab -> Wrap around to Cancel button
    await userEvent.tab();
    expect(cancelBtn).toHaveFocus();

    // Shift+Tab -> Wrap around backwards to Confirm button
    await userEvent.tab({ shift: true });
    expect(confirmBtn).toHaveFocus();
  });

  it("restitue le focus à l'élément déclencheur à la fermeture", async () => {
    render(<TestHost />);
    const trigger = screen.getByTestId('trigger');

    // Clic sur l'élément déclencheur
    await userEvent.click(trigger);
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();

    // Annuler pour fermer
    await userEvent.click(screen.getByRole('button', { name: 'Annuler action' }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();

    // Le déclencheur a récupéré le focus
    await waitFor(() => expect(trigger).toHaveFocus());
  });
});
