// Sélecteur de langue des écrans publics (#112) et langue initiale à la première ouverture.
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import i18n, { applyLanguage, initialLanguage } from '@/i18n';
import { LanguageSwitcher } from './LanguageSwitcher';

vi.mock('@/i18n', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/i18n')>();
  return { ...actual, applyLanguage: vi.fn((code: string) => actual.default.changeLanguage(code)) };
});

afterEach(async () => {
  vi.mocked(applyLanguage).mockClear();
  await act(() => i18n.changeLanguage('fr'));
});

describe('<LanguageSwitcher />', () => {
  it('propose les 4 langues, écrites dans leur propre langue, dans un groupe nommé', () => {
    render(<LanguageSwitcher />);
    expect(screen.getByRole('group', { name: 'Langue' })).toBeInTheDocument();
    for (const name of ['Français', 'English', 'العربية', 'تونسي (Darija)']) {
      expect(screen.getByRole('button', { name })).toHaveClass('min-h-11');
    }
    expect(screen.getByRole('button', { name: 'العربية' })).toHaveAttribute('lang', 'ar');
    expect(screen.getByRole('button', { name: 'تونسي (Darija)' })).toHaveAttribute('lang', 'ar-TN');
  });

  it('annonce la langue affichée et applique la langue choisie', async () => {
    render(<LanguageSwitcher />);
    expect(screen.getByRole('button', { name: 'Français' })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(screen.getByRole('button', { name: 'English' }));
    expect(applyLanguage).toHaveBeenCalledWith('en');
    expect(screen.getByRole('button', { name: 'English' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Français' })).toHaveAttribute('aria-pressed', 'false');
    // Le groupe se renomme dans la nouvelle langue.
    expect(screen.getByRole('group', { name: 'Language' })).toBeInTheDocument();
  });
});

describe('initialLanguage() — première ouverture', () => {
  it.each([
    [null, ['en-US', 'fr'], 'en'],
    [null, ['ar-TN'], 'ar'], // jamais le darija automatiquement
    [null, ['ar'], 'ar'],
    [null, ['de-DE', 'fr-FR'], 'fr'],
    [null, ['de-DE', 'es'], 'fr'],
    [null, [], 'fr'],
    ['tn', ['en-US'], 'tn'], // un choix mémorisé l'emporte, y compris le darija choisi à la main
    ['en', ['ar'], 'en'],
    ['xx', ['ar'], 'ar'], // valeur mémorisée invalide : ignorée
  ] as const)('mémorisée %s, navigateur %j → %s', (saved, browser, expected) => {
    expect(initialLanguage(saved, [...browser])).toBe(expected);
  });
});
