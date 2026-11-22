import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Settings from './Settings';
import * as api from '../api';

let role: 'patient' | 'doctor' = 'patient';

vi.mock('@/features/auth/AuthProvider', () => ({
  useAuth: () => ({
    profile: {
      id: 'p1',
      role,
      first_name: 'Amina',
      last_name: 'B',
      language: 'fr',
      notif_meds: false,
      notif_community: false,
      notif_tips: false,
    },
    refreshProfile: vi.fn(),
    signOut: vi.fn(),
  }),
}));
vi.mock('@/features/rappels/notifications', () => ({
  checkPermission: () => Promise.resolve('granted'),
  remindersSupported: () => false,
  requestPermission: () => Promise.resolve('granted'),
}));
vi.mock('../api', () => ({
  updateProfile: vi.fn(),
  exportMyData: vi.fn(),
  deleteJournals: vi.fn(),
  deleteMyAccount: vi.fn(),
}));

const createObjectURL = vi.fn(() => 'blob:export');
let click: ReturnType<typeof vi.spyOn>;
let blobs: Blob[] = [];

beforeEach(() => {
  role = 'patient';
  blobs = [];
  vi.mocked(api.exportMyData).mockReset();
  createObjectURL.mockClear();
  createObjectURL.mockImplementation(((b: Blob) => {
    blobs.push(b);
    return 'blob:export';
  }) as never);
  Object.defineProperty(URL, 'createObjectURL', { value: createObjectURL, configurable: true });
  click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
});
afterEach(() => click.mockRestore());

describe('Export des données (Paramètres)', () => {
  it('télécharge le JSON renvoyé par export_my_data', async () => {
    vi.mocked(api.exportMyData).mockResolvedValueOnce({ profiles: [{ id: 'p1' }], mood_logs: [] });
    render(<Settings />);
    await userEvent.click(screen.getByRole('button', { name: 'Exporter mes données' }));

    expect(api.exportMyData).toHaveBeenCalledTimes(1);
    expect(click).toHaveBeenCalledTimes(1);
    expect(blobs).toHaveLength(1);
    expect(JSON.parse(await blobs[0].text())).toEqual({ profiles: [{ id: 'p1' }], mood_logs: [] });
    expect(screen.queryByText(/L'export a échoué/)).not.toBeInTheDocument();
  });

  it('affiche une alerte et ne télécharge rien si l’export échoue', async () => {
    vi.mocked(api.exportMyData).mockRejectedValueOnce(new Error('boom'));
    render(<Settings />);
    await userEvent.click(screen.getByRole('button', { name: 'Exporter mes données' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent("L'export a échoué");
    expect(click).not.toHaveBeenCalled();
    expect(createObjectURL).not.toHaveBeenCalled();
  });

  it('n’affiche pas le bouton d’export à un médecin', () => {
    role = 'doctor';
    render(<Settings />);
    expect(screen.queryByRole('button', { name: 'Exporter mes données' })).not.toBeInTheDocument();
  });
});
