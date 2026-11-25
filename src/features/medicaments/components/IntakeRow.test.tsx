// Ligne de prise (#100) : le nom du médicament est toujours lisible en entier (jamais tronqué),
// et le bouton « Pris » garde son libellé accessible. jsdom ne mesure pas le rendu : le test fige
// l'absence de troncature (classe truncate) et la présence du nom complet.
import { render, screen } from '@testing-library/react';
import { IntakeRow } from './IntakeRow';
import type { Intake } from '../types';

const LONG_NAME = 'Azathioprine Mylan comprimé pelliculé 50'; // 40 caractères

const intake = (status: Intake['status']): Intake => ({
  id: 'i1',
  scheduled_at: new Date(Date.now() + 3_600_000).toISOString(),
  taken_at: null,
  status,
  prescription_id: 'rx1',
  prescriptions: { medication: LONG_NAME, dosage: '1 comprimé' },
});

describe('<IntakeRow /> — nom du médicament', () => {
  it('affiche un nom de 40 caractères en entier, sans troncature', () => {
    render(
      <ul>
        <IntakeRow intake={intake('pending')} locale="fr" onTake={vi.fn()} />
      </ul>,
    );
    expect(LONG_NAME).toHaveLength(40);
    const name = screen.getByText(LONG_NAME);
    expect(name).not.toHaveClass('truncate');
    expect(name.closest('p')).not.toHaveClass('truncate');
    expect(name.textContent).toBe(LONG_NAME);
  });

  it('isole le nom et le dosage (<bdi>) pour garder leur ordre en arabe', () => {
    render(
      <ul>
        <IntakeRow intake={intake('pending')} locale="ar" onTake={vi.fn()} />
      </ul>,
    );
    expect(screen.getByText(LONG_NAME).tagName).toBe('BDI');
    expect(screen.getByText('1 comprimé').tagName).toBe('BDI');
  });

  it('garde le bouton « Pris » avec son libellé accessible et une cible de 44 px', () => {
    render(
      <ul>
        <IntakeRow intake={intake('pending')} locale="fr" onTake={vi.fn()} />
      </ul>,
    );
    const button = screen.getByRole('button', { name: `Marquer comme pris : ${LONG_NAME}` });
    expect(button).toHaveClass('min-h-11');
  });

  it('sans action (calendrier) : le nom reste entier et le statut est affiché', () => {
    render(
      <ul>
        <IntakeRow intake={intake('taken')} locale="fr" />
      </ul>,
    );
    expect(screen.getByText(LONG_NAME).closest('p')).not.toHaveClass('truncate');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByText('Pris')).toBeInTheDocument();
  });
});
