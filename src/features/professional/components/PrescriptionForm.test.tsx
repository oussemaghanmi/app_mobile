import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PrescriptionForm } from './PrescriptionForm';

describe('<PrescriptionForm />', () => {
  it('envoie médicament, dosage et plusieurs horaires', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<PrescriptionForm onSubmit={onSubmit} onCancel={vi.fn()} />);
    await userEvent.type(screen.getByLabelText('Médicament'), 'Mésalazine');
    await userEvent.type(screen.getByLabelText('Dosage'), '1 g');
    await userEvent.click(screen.getByRole('button', { name: '+ Ajouter un horaire' }));
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ medication: 'Mésalazine', dosage: '1 g', times_of_day: ['08:00', '12:00'] }),
    );
  });

  it('refuse une date de fin avant la date de début', async () => {
    const onSubmit = vi.fn();
    render(
      <PrescriptionForm
        initial={{
          medication: 'X',
          dosage: 'Y',
          times_of_day: ['08:00'],
          start_date: '2026-11-10',
          end_date: '2026-11-01',
        }}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    expect(onSubmit).not.toHaveBeenCalled();
    // bloqué par la validation native (min) ou par le contrôle applicatif
    const end = screen.getByLabelText('Fin (facultatif)') as HTMLInputElement;
    expect(end.validity.valid === false || screen.queryByRole('alert') !== null).toBe(true);
  });
});
