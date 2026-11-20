import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SymptomForm } from './SymptomForm';

describe('<SymptomForm />', () => {
  it('envoie douleur, selles, règles et notes', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<SymptomForm onSubmit={onSubmit} />);
    fireEvent.change(screen.getByRole('slider'), { target: { value: '6' } });
    await userEvent.click(screen.getByRole('button', { name: 'Augmenter' }));
    await userEvent.click(screen.getByRole('button', { name: 'Augmenter' }));
    await userEvent.click(screen.getByRole('checkbox', { name: 'Jour de règles' }));
    await userEvent.type(screen.getByRole('textbox'), 'fatigue');
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    expect(onSubmit).toHaveBeenCalledWith({ pain_level: 6, stools_per_day: 2, on_period: true, notes: 'fatigue' });
    expect(await screen.findByText('Entrée enregistrée.')).toBeInTheDocument();
  });

  it('ne descend pas sous 0 selle', async () => {
    render(<SymptomForm onSubmit={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Diminuer' }));
    expect(screen.getByRole('group', { name: "Nombre de selles aujourd'hui" })).toHaveTextContent('0');
  });
});
