import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AsyncView } from './AsyncView';
import type { AsyncState } from '@/lib/useAsync';

const state = <T,>(over: Partial<AsyncState<T>>): AsyncState<T> => ({
  data: undefined,
  error: null,
  loading: false,
  reload: vi.fn(),
  ...over,
});

describe('<AsyncView />', () => {
  it('affiche le chargement', () => {
    render(<AsyncView state={state({ loading: true })}>{() => null}</AsyncView>);
    expect(screen.getByRole('status')).toHaveTextContent('Chargement');
  });

  it("affiche l'erreur et permet de réessayer", async () => {
    const s = state<string[]>({ error: new Error('boom') });
    render(<AsyncView state={s}>{() => null}</AsyncView>);
    await userEvent.click(screen.getByRole('button', { name: 'Réessayer' }));
    expect(s.reload).toHaveBeenCalled();
  });

  it("affiche l'état vide", () => {
    render(
      <AsyncView state={state({ data: [] as string[] })} isEmpty={(d) => d.length === 0} empty="Vide">
        {() => null}
      </AsyncView>,
    );
    expect(screen.getByText('Vide')).toBeInTheDocument();
  });

  it('affiche les données', () => {
    render(<AsyncView state={state({ data: ['a', 'b'] })}>{(d) => <p>{d.join(',')}</p>}</AsyncView>);
    expect(screen.getByText('a,b')).toBeInTheDocument();
  });
});
