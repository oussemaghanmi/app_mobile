import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SignUp from './SignUp';
import ForgotPassword from './ForgotPassword';
import ResetPassword from './ResetPassword';
import Login from './Login';
import * as api from '../api';

vi.mock('../AuthProvider', () => ({
  useAuth: () => ({ session: null, profile: null, loading: false }),
}));

vi.mock('../api', () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  updatePassword: vi.fn(),
}));

describe('Auth screens', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

    it('appelle signUp avec prénom, e-mail et mot de passe et affiche le succès', async () => {
      vi.mocked(api.signUp).mockResolvedValueOnce({ success: true });

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
      expect(status).toHaveTextContent('Compte créé !');
    });

    it('affiche une alerte en cas d’erreur de l’API', async () => {
      vi.mocked(api.signUp).mockResolvedValueOnce({
        success: false,
        error: 'User already registered',
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
      expect(alert).toHaveTextContent('User already registered');
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

    it('affiche une alerte si la réinitialisation échoue', async () => {
      vi.mocked(api.resetPasswordForEmail).mockResolvedValueOnce({
        success: false,
        error: 'Erreur e-mail invalide',
      });

      render(
        <MemoryRouter>
          <ForgotPassword />
        </MemoryRouter>,
      );

      await userEvent.type(screen.getByPlaceholderText('E-mail'), 'invalid@test.com');
      await userEvent.click(screen.getByRole('button', { name: 'Envoyer le lien' }));

      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent('Erreur e-mail invalide');
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
