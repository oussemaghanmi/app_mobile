import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Session } from '@supabase/supabase-js';
import SignUp from './SignUp';
import ForgotPassword from './ForgotPassword';
import ResetPassword from './ResetPassword';
import Login from './Login';
import * as api from '../api';
import { applyLanguage } from '@/i18n';

vi.mock('../AuthProvider', () => ({
  useAuth: () => ({ session: null, profile: null, loading: false }),
}));

vi.mock('../api', () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  updatePassword: vi.fn(),
  getSession: vi.fn(),
  onAuthStateChange: vi.fn((_cb: (event: string, session: Session | null) => void) => () => {}),
  onSessionChange: vi.fn(() => () => {}),
  authErrorKey: vi.fn((err: string | { name?: string; code?: string }) => {
    if (typeof err === 'string') {
      if (err === 'otp_expired' || err === 'access_denied') return 'auth.errors.linkExpired';
      if (err === 'user_already_exists') return 'auth.errors.alreadyRegistered';
    }
    return 'auth.genericError';
  }),
}));

describe('Auth screens', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.location.hash = '';
    window.location.search = '';
    vi.mocked(api.getSession).mockResolvedValue({
      user: { id: 'test-user-id' },
    } as unknown as Awaited<ReturnType<typeof api.getSession>>);
  });

  afterEach(() => {
    applyLanguage('fr');
    window.location.hash = '';
    window.location.search = '';
  });

  describe('<SignUp />', () => {
    it('affiche le formulaire d’inscription et les règles de mot de passe', () => {
      render(
        <MemoryRouter>
          <SignUp />
        </MemoryRouter>,
      );

      expect(screen.getByRole('heading', { name: 'Inscription' })).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Prénom')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('E-mail')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Mot de passe')).toBeInTheDocument();
      expect(screen.getByText('Au moins 6 caractères')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Créer mon compte' })).toBeInTheDocument();
    });

    it('affiche une erreur role="alert" si le mot de passe fait moins de 6 caractères', async () => {
      render(
        <MemoryRouter>
          <SignUp />
        </MemoryRouter>,
      );

      await userEvent.type(screen.getByPlaceholderText('Prénom'), 'Sarah');
      await userEvent.type(screen.getByPlaceholderText('E-mail'), 'sarah@test.com');
      await userEvent.type(screen.getByPlaceholderText('Mot de passe'), '12345');
      await userEvent.click(screen.getByRole('button', { name: 'Créer mon compte' }));

      const alert = screen.getByRole('alert');
      expect(alert).toHaveTextContent('Le mot de passe doit comporter au moins 6 caractères.');
      expect(api.signUp).not.toHaveBeenCalled();
    });

    it('affiche le message d’auto-connexion quand confirmations désactivées (hasSession: true)', async () => {
      vi.mocked(api.signUp).mockResolvedValueOnce({ success: true, hasSession: true });

      render(
        <MemoryRouter>
          <SignUp />
        </MemoryRouter>,
      );

      await userEvent.type(screen.getByPlaceholderText('Prénom'), 'Sarah');
      await userEvent.type(screen.getByPlaceholderText('E-mail'), 'sarah@test.com');
      await userEvent.type(screen.getByPlaceholderText('Mot de passe'), 'password123');
      await userEvent.click(screen.getByRole('button', { name: 'Créer mon compte' }));

      expect(api.signUp).toHaveBeenCalledWith('sarah@test.com', 'password123', 'Sarah');
      const status = await screen.findByRole('status');
      expect(status).toHaveTextContent('Compte créé avec succès ! Connexion en cours…');
    });

    it('affiche le message de confirmation par e-mail quand confirmations activées (hasSession: false)', async () => {
      vi.mocked(api.signUp).mockResolvedValueOnce({ success: true, hasSession: false });

      render(
        <MemoryRouter>
          <SignUp />
        </MemoryRouter>,
      );

      await userEvent.type(screen.getByPlaceholderText('Prénom'), 'Sarah');
      await userEvent.type(screen.getByPlaceholderText('E-mail'), 'sarah@test.com');
      await userEvent.type(screen.getByPlaceholderText('Mot de passe'), 'password123');
      await userEvent.click(screen.getByRole('button', { name: 'Créer mon compte' }));

      expect(api.signUp).toHaveBeenCalledWith('sarah@test.com', 'password123', 'Sarah');
      const status = await screen.findByRole('status');
      expect(status).toHaveTextContent('Compte créé ! Vérifiez votre boîte de réception');
    });

    it('traduit l’erreur en cas d’e-mail déjà enregistré', async () => {
      vi.mocked(api.signUp).mockResolvedValueOnce({
        success: false,
        errorKey: 'auth.errors.alreadyRegistered',
      });

      render(
        <MemoryRouter>
          <SignUp />
        </MemoryRouter>,
      );

      await userEvent.type(screen.getByPlaceholderText('Prénom'), 'Sarah');
      await userEvent.type(screen.getByPlaceholderText('E-mail'), 'sarah@test.com');
      await userEvent.type(screen.getByPlaceholderText('Mot de passe'), 'password123');
      await userEvent.click(screen.getByRole('button', { name: 'Créer mon compte' }));

      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent('Un compte existe déjà');
    });

    it('s’affiche correctement en arabe avec RTL', async () => {
      applyLanguage('ar');

      render(
        <MemoryRouter>
          <SignUp />
        </MemoryRouter>,
      );

      expect(screen.getByRole('heading', { name: 'إنشاء حساب' })).toBeInTheDocument();
      expect(screen.getByPlaceholderText('الاسم الشخصي')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('البريد الإلكتروني')).toBeInTheDocument();
      expect(document.documentElement.dir).toBe('rtl');
    });
  });

  describe('<ForgotPassword />', () => {
    it('affiche le formulaire et envoie le lien par e-mail', async () => {
      vi.mocked(api.resetPasswordForEmail).mockResolvedValueOnce({ success: true });

      render(
        <MemoryRouter>
          <ForgotPassword />
        </MemoryRouter>,
      );

      expect(screen.getByRole('heading', { name: 'Mot de passe oublié' })).toBeInTheDocument();
      await userEvent.type(screen.getByPlaceholderText('E-mail'), 'sarah@test.com');
      await userEvent.click(screen.getByRole('button', { name: 'Envoyer le lien' }));

      expect(api.resetPasswordForEmail).toHaveBeenCalledWith('sarah@test.com');
      const status = await screen.findByRole('status');
      expect(status).toHaveTextContent('un lien de réinitialisation a été envoyé');
    });

    it('affiche une alerte traduite si la réinitialisation échoue par rate limit', async () => {
      vi.mocked(api.resetPasswordForEmail).mockResolvedValueOnce({
        success: false,
        errorKey: 'auth.errors.rateLimited',
      });

      render(
        <MemoryRouter>
          <ForgotPassword />
        </MemoryRouter>,
      );

      await userEvent.type(screen.getByPlaceholderText('E-mail'), 'invalid@test.com');
      await userEvent.click(screen.getByRole('button', { name: 'Envoyer le lien' }));

      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent('Trop de demandes');
    });

    it('s’affiche correctement en arabe avec RTL', async () => {
      applyLanguage('ar');

      render(
        <MemoryRouter>
          <ForgotPassword />
        </MemoryRouter>,
      );

      expect(screen.getByRole('heading', { name: 'نسيت كلمة المرور' })).toBeInTheDocument();
      expect(screen.getByPlaceholderText('البريد الإلكتروني')).toBeInTheDocument();
      expect(document.documentElement.dir).toBe('rtl');
    });
  });

  describe('<ResetPassword />', () => {
    it('vérifie la longueur minimale et la correspondance des mots de passe', async () => {
      render(
        <MemoryRouter>
          <ResetPassword />
        </MemoryRouter>,
      );

      await userEvent.type(screen.getByPlaceholderText('Nouveau mot de passe'), '12345');
      await userEvent.type(screen.getByPlaceholderText('Confirmer le mot de passe'), '12345');
      await userEvent.click(screen.getByRole('button', { name: 'Enregistrer le mot de passe' }));

      expect(screen.getByRole('alert')).toHaveTextContent(
        'Le mot de passe doit comporter au moins 6 caractères.',
      );

      await userEvent.clear(screen.getByPlaceholderText('Nouveau mot de passe'));
      await userEvent.clear(screen.getByPlaceholderText('Confirmer le mot de passe'));
      await userEvent.type(screen.getByPlaceholderText('Nouveau mot de passe'), 'secret123');
      await userEvent.type(screen.getByPlaceholderText('Confirmer le mot de passe'), 'different123');
      await userEvent.click(screen.getByRole('button', { name: 'Enregistrer le mot de passe' }));

      expect(screen.getByRole('alert')).toHaveTextContent('Les mots de passe ne correspondent pas.');
    });

    it('met à jour le mot de passe avec succès', async () => {
      vi.mocked(api.updatePassword).mockResolvedValueOnce({ success: true });

      render(
        <MemoryRouter>
          <ResetPassword />
        </MemoryRouter>,
      );

      await userEvent.type(screen.getByPlaceholderText('Nouveau mot de passe'), 'secret123');
      await userEvent.type(screen.getByPlaceholderText('Confirmer le mot de passe'), 'secret123');
      await userEvent.click(screen.getByRole('button', { name: 'Enregistrer le mot de passe' }));

      expect(api.updatePassword).toHaveBeenCalledWith('secret123');
      const status = await screen.findByRole('status');
      expect(status).toHaveTextContent('Votre mot de passe a été réinitialisé avec succès.');
    });

    it('affiche une erreur traduite si le lien URL contient error_code=otp_expired', () => {
      window.location.hash = '#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired';
      vi.mocked(api.authErrorKey).mockReturnValueOnce('auth.errors.linkExpired');

      render(
        <MemoryRouter>
          <ResetPassword />
        </MemoryRouter>,
      );

      const alert = screen.getByRole('alert');
      expect(alert).toHaveTextContent('Ce lien a expiré ou a déjà été utilisé');
      expect(screen.getByRole('link', { name: 'Demander un nouveau lien' })).toHaveAttribute(
        'href',
        '/forgot-password',
      );
    });

    it('affiche un message et un bouton de nouveau lien si aucune session de récupération n’est active', async () => {
      vi.mocked(api.getSession).mockResolvedValueOnce(null);

      render(
        <MemoryRouter>
          <ResetPassword />
        </MemoryRouter>,
      );

      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent(
        'Aucune session de récupération active. Veuillez demander un nouveau lien.',
      );
      expect(screen.getByRole('link', { name: 'Demander un nouveau lien' })).toHaveAttribute(
        'href',
        '/forgot-password',
      );
    });

    it('affiche le formulaire si un événement PASSWORD_RECOVERY survient', async () => {
      vi.mocked(api.getSession).mockResolvedValueOnce(null);
      let authCallback: ((event: string, session: Session | null) => void) | null = null;
      vi.mocked(api.onAuthStateChange).mockImplementationOnce((cb) => {
        authCallback = cb;
        return () => {};
      });

      render(
        <MemoryRouter>
          <ResetPassword />
        </MemoryRouter>,
      );

      // Initialement pas de session
      expect(
        await screen.findByText('Aucune session de récupération active. Veuillez demander un nouveau lien.'),
      ).toBeInTheDocument();

      // Arrivée de l'événement PASSWORD_RECOVERY
      authCallback!('PASSWORD_RECOVERY', { user: { id: 'recovered-user' } } as unknown as Session);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Nouveau mot de passe')).toBeInTheDocument();
      });
    });

    it('s’affiche correctement en arabe avec RTL', async () => {
      applyLanguage('ar');

      render(
        <MemoryRouter>
          <ResetPassword />
        </MemoryRouter>,
      );

      expect(screen.getByRole('heading', { name: 'كلمة مرور جديدة' })).toBeInTheDocument();
      expect(screen.getByPlaceholderText('كلمة مرور جديدة')).toBeInTheDocument();
      expect(document.documentElement.dir).toBe('rtl');
    });
  });

  describe('<Login />', () => {
    it('propose des liens vers l’inscription et la récupération de mot de passe', () => {
      render(
        <MemoryRouter>
          <Login />
        </MemoryRouter>,
      );

      expect(screen.getByRole('link', { name: 'Mot de passe oublié ?' })).toHaveAttribute(
        'href',
        '/forgot-password',
      );
      expect(screen.getByRole('link', { name: "Pas encore de compte ? S'inscrire" })).toHaveAttribute(
        'href',
        '/signup',
      );
    });
  });
});
