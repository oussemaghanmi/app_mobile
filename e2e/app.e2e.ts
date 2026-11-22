import { expect, test, type Page } from '@playwright/test';
import { intakeFlowPossible, MEDICATION, PASSWORD, PRIVATE_MARKER, USERS } from './fixtures';

async function login(page: Page, email: string, password = PASSWORD) {
  await page.goto('/login');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Mot de passe').fill(password);
  await page.getByRole('button', { name: 'Se connecter' }).click();
  // Avec un bon mot de passe, attendre l'arrivée dans l'espace du rôle : naviguer avant interromprait la connexion.
  if (password === PASSWORD) await page.waitForURL(/\/(patient|doctor|nurse)$/);
}

test.describe('accès et redirections', () => {
  test('un visiteur non connecté est renvoyé vers la connexion', async ({ page }) => {
    await page.goto('/patient');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('un mot de passe incorrect affiche une erreur et reste sur la connexion', async ({ page }) => {
    await login(page, USERS.patient.email, 'mauvais-mot-de-passe');
    await expect(page.getByText('Identifiants invalides')).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('un patient qui ouvre /doctor est renvoyé vers son espace', async ({ page }) => {
    await login(page, USERS.patient.email);
    await expect(page).toHaveURL(/\/patient$/);
    await page.goto('/doctor');
    await expect(page).toHaveURL(/\/patient$/);
  });
});

test.describe('espace patient', () => {
  test('la patiente coche sa prise et le compteur passe à 1/1', async ({ page }) => {
    test.skip(!intakeFlowPossible(), 'trop près de minuit à Tunis : la prise tomberait demain');
    await login(page, USERS.patient.email);
    await expect(page.getByRole('heading', { name: `Bonjour ${USERS.patient.first}` })).toBeVisible();
    await expect(page.getByText('0/1')).toBeVisible();
    await expect(page.getByText(MEDICATION)).toBeVisible();
    await page.getByRole('button', { name: new RegExp(`Marquer comme pris : ${MEDICATION}`) }).click();
    await expect(page.getByText('1/1')).toBeVisible();
  });

  test('la patiente retrouve son journal privé', async ({ page }) => {
    await login(page, USERS.patient.email);
    await page.goto('/patient/journal');
    await page.getByRole('tab', { name: /Journal privé/ }).click();
    await expect(page.getByText(PRIVATE_MARKER)).toBeVisible();
  });
});

for (const role of ['doctor', 'nurse'] as const) {
  test.describe(`espace ${role === 'doctor' ? 'médecin' : 'infirmière'}`, () => {
    test('voit ses patients affectés, pas les autres', async ({ page }) => {
      await login(page, USERS[role].email);
      await expect(page).toHaveURL(new RegExp(`/${role}$`));
      await expect(page.getByRole('heading', { name: 'Mes patients' })).toBeVisible();
      await expect(page.getByRole('link', { name: new RegExp(USERS.patient.first) })).toBeVisible();
      await expect(page.getByText(USERS.stranger.first)).toHaveCount(0);
    });

    test('ouvre la fiche patient sans jamais voir le journal privé', async ({ page }) => {
      await login(page, USERS[role].email);
      await page.getByRole('link', { name: new RegExp(USERS.patient.first) }).click();
      await expect(page).toHaveURL(new RegExp(`/${role}/patients/[0-9a-f-]+$`));
      await expect(page.getByText(/journal privé du patient n'est jamais accessible/i)).toBeVisible();
      await expect(page.getByText('Observance 30 jours')).toBeVisible();
      await expect(page.locator('body')).not.toContainText(PRIVATE_MARKER);
    });
  });
}
