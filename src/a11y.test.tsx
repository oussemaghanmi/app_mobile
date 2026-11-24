// Audit d'accessibilité automatisé (issue #40) : aucun écran principal ne doit présenter de violation
// axe de niveau « serious » ou « critical ». Les données sont simulées ; seule la structure est jugée.
import { render, screen, type RenderResult } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { ReactNode } from 'react';
import { seriousViolations } from '@/test/axe';
import type { AsyncState } from '@/lib/useAsync';
import Login from '@/features/auth/components/Login';
import PatientHome from '@/features/home/components/PatientHome';
import MedicationsScreen from '@/features/medicaments/components/MedicationsScreen';
import JournalScreen from '@/features/journal/components/JournalScreen';
import CommunityScreen from '@/features/communaute/components/CommunityScreen';
import CrohnBotScreen from '@/features/crohnbot/components/CrohnBotScreen';
import Settings from '@/features/settings/components/Settings';
import PatientRecord from '@/features/professional/components/PatientRecord';
import TrackingScreen from '@/features/suivi/components/TrackingScreen';

const now = new Date();
const iso = (hours: number) => new Date(now.getTime() + hours * 3_600_000).toISOString();
const ok = <T,>(data: T): AsyncState<T> => ({ data, loading: false, error: null, reload: vi.fn() });

const session = vi.hoisted(() => ({ loggedIn: true, role: 'patient' as 'patient' | 'doctor' }));
const profile = () => ({
  id: session.role === 'patient' ? 'p1' : 'd1',
  role: session.role,
  first_name: session.role === 'patient' ? 'Amina' : 'Karim',
  last_name: 'B',
  language: 'fr',
  notif_meds: true,
  notif_community: false,
  notif_tips: true,
  created_at: iso(-100),
});

vi.mock('@/features/auth/AuthProvider', () => ({
  useAuth: () => ({
    session: session.loggedIn ? { user: { id: 'p1' } } : null,
    profile: session.loggedIn ? profile() : null,
    loading: false,
    refreshProfile: vi.fn(),
    signOut: vi.fn(),
  }),
}));
vi.mock('@/features/auth/api', () => ({ signIn: vi.fn() }));
vi.mock('@/components/PatientLayout', () => ({ usePatientContext: () => ({ intakesReady: true }) }));
vi.mock('@/features/rappels/notifications', () => ({
  checkPermission: () => Promise.resolve('granted'),
  remindersSupported: () => false,
  requestPermission: () => Promise.resolve('granted'),
  cancelReminder: () => Promise.resolve(),
}));

vi.mock('@/features/home/hooks', () => ({
  usePatientHome: () => ({
    mood: 4,
    saveMood: vi.fn(),
    intakes: [
      {
        id: 'i1',
        status: 'taken',
        scheduled_at: iso(-4),
        prescriptions: { medication: 'Mésalazine', dosage: '1 g' },
      },
      {
        id: 'i2',
        status: 'pending',
        scheduled_at: iso(2),
        prescriptions: { medication: 'Azathioprine', dosage: '50 mg' },
      },
    ],
    adherence: 86,
    tip: 'Buvez régulièrement dans la journée.',
    markTaken: vi.fn(),
  }),
}));

const intake = (id: string, hours: number, status: 'taken' | 'pending') => ({
  id,
  scheduled_at: iso(hours),
  taken_at: status === 'taken' ? iso(hours) : null,
  status,
  prescription_id: 'rx1',
  prescriptions: { medication: 'Azathioprine', dosage: '50 mg' },
});
vi.mock('@/features/medicaments/hooks', () => ({
  useMedications: () => ({
    prescriptions: ok([
      {
        id: 'rx1',
        patient_id: 'p1',
        prescribed_by: 'd1',
        medication: 'Azathioprine',
        dosage: '50 mg',
        times_of_day: ['08:00', '20:00'],
        start_date: '2026-11-01',
        end_date: null,
        active: true,
        created_at: iso(-500),
      },
    ]),
    today: ok([intake('t1', -3, 'taken'), intake('t2', 3, 'pending')]),
    history: ok([intake('h1', -27, 'taken'), intake('t1', -3, 'taken')]),
    adherence: ok(86),
    markTaken: vi.fn(),
  }),
}));

vi.mock('@/features/journal/hooks', () => ({
  useSymptomLogs: () =>
    ok([
      {
        id: 's1',
        patient_id: 'p1',
        logged_at: iso(-20),
        pain_level: 3,
        stools_per_day: 2,
        on_period: true,
        notes: 'Fatigue le soir',
      },
    ]),
  usePrivateEntries: () => ok([]),
}));
vi.mock('@/features/journal/api', () => ({
  addSymptomLog: vi.fn(),
  deleteSymptomLog: vi.fn(),
  addPrivateEntry: vi.fn(),
  deletePrivateEntry: vi.fn(),
}));

vi.mock('@/features/communaute/hooks', () => ({
  useMyPseudonym: () => ok('Jasmin'),
  usePosts: () =>
    ok([
      {
        id: 'post1',
        author_id: 'other',
        content: 'La marche du matin m’aide beaucoup.',
        hidden: false,
        created_at: iso(-30),
        author: { pseudonym: 'Olivier' },
        community_comments: [{ count: 0 }],
      },
    ]),
  useComments: () => ok([]),
}));
vi.mock('@/features/communaute/api', () => ({
  createPost: vi.fn(),
  createPseudonym: vi.fn(),
  deletePost: vi.fn(),
  deleteComment: vi.fn(),
  createComment: vi.fn(),
  report: vi.fn(),
}));

vi.mock('@/features/crohnbot/api', () => ({ askCrohnBot: vi.fn() }));

vi.mock('@/features/suivi/hooks', () => ({
  useTracking: () => ({
    days: ['2026-11-22', '2026-11-23', '2026-11-24'],
    symptoms: ok([{ logged_at: iso(-30), pain_level: 3, stools_per_day: 2 }]),
    moods: ok([{ day: iso(-24).slice(0, 10), mood: 4 }]),
    intakes: ok([{ status: 'taken', scheduled_at: iso(-5) }]),
  }),
}));

vi.mock('@/features/settings/api', () => ({
  updateProfile: vi.fn(),
  exportMyData: vi.fn(),
  deleteJournals: vi.fn(),
  deleteMyAccount: vi.fn(),
}));

vi.mock('@/features/professional/hooks', () => ({
  usePatientRecord: () => ({
    patient: ok({ id: 'p1', first_name: 'Amina', last_name: 'B' }),
    moods: ok([{ day: iso(-24).slice(0, 10), mood: 3 }]),
    symptoms: ok([
      {
        id: 's1',
        patient_id: 'p1',
        logged_at: iso(-20),
        pain_level: 3,
        stools_per_day: 2,
        on_period: false,
        notes: null,
      },
    ]),
    intakes: ok([intake('h1', -27, 'taken')]),
    prescriptions: ok([
      {
        id: 'rx1',
        patient_id: 'p1',
        prescribed_by: 'd1',
        medication: 'Azathioprine',
        dosage: '50 mg',
        times_of_day: ['08:00'],
        start_date: '2026-11-01',
        end_date: null,
        active: true,
        created_at: iso(-500),
        author: { first_name: 'Karim', last_name: 'B' },
      },
    ]),
    notes: ok([]),
    appointments: ok([
      {
        id: 'a1',
        patient_id: 'p1',
        professional_id: 'd1',
        starts_at: iso(72),
        duration_minutes: 30,
        location: 'Hôpital La Rabta',
        notes: null,
        created_at: iso(-10),
      },
    ]),
  }),
}));
vi.mock('@/features/professional/api', () => ({
  createAppointment: vi.fn(),
  deleteAppointment: vi.fn(),
  setPrescriptionActive: vi.fn(),
  createPrescription: vi.fn(),
  updatePrescription: vi.fn(),
  createNursingNote: vi.fn(),
}));

const inRouter = (ui: ReactNode, path = '/', route = '/'): RenderResult =>
  render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path={path} element={ui} />
      </Routes>
    </MemoryRouter>,
  );

beforeEach(() => {
  session.loggedIn = true;
  session.role = 'patient';
});

describe('Accessibilité (axe) des écrans principaux : aucune violation sérieuse ou critique', () => {
  it('Connexion', async () => {
    session.loggedIn = false;
    const { container } = inRouter(<Login />);
    expect(await seriousViolations(container)).toEqual([]);
  });

  it('Accueil patient', async () => {
    const { container } = inRouter(<PatientHome />);
    await screen.findByRole('heading', { level: 1 });
    expect(await seriousViolations(container)).toEqual([]);
  });

  it('Médicaments', async () => {
    const { container } = inRouter(<MedicationsScreen />);
    await screen.findByRole('heading', { level: 1 });
    expect(await seriousViolations(container)).toEqual([]);
  });

  it('Journal', async () => {
    const { container } = inRouter(<JournalScreen />);
    await screen.findByRole('heading', { level: 1 });
    expect(await seriousViolations(container)).toEqual([]);
  });

  it('Communauté', async () => {
    const { container } = inRouter(<CommunityScreen />);
    await screen.findByRole('heading', { level: 1 });
    expect(await seriousViolations(container)).toEqual([]);
  });

  it('Assistant CrohnBot', async () => {
    const { container } = inRouter(<CrohnBotScreen />);
    await screen.findByRole('heading', { level: 1 });
    expect(await seriousViolations(container)).toEqual([]);
  });

  it('Paramètres', async () => {
    const { container } = inRouter(<Settings />);
    await screen.findByRole('heading', { level: 1 });
    expect(await seriousViolations(container)).toEqual([]);
    // La langue active est annoncée aux lecteurs d'écran, pas seulement mise en gras.
    expect(screen.getByRole('button', { name: 'Français' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'English' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('Mon suivi', async () => {
    const { container } = inRouter(<TrackingScreen />);
    await screen.findByRole('heading', { level: 1 });
    expect(await seriousViolations(container)).toEqual([]);
  });

  it('Fiche patient (médecin)', async () => {
    session.role = 'doctor';
    const { container } = inRouter(<PatientRecord />, '/doctor/patients/:id', '/doctor/patients/p1');
    await screen.findByRole('heading', { level: 1 });
    expect(await seriousViolations(container)).toEqual([]);
  });
});
