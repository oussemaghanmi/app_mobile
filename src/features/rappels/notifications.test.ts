import { notificationId } from './notifications';

vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => false } }));

describe('rappels', () => {
  it('produit un identifiant entier positif stable', () => {
    const id = notificationId('3f2b6c1e-0000-4000-8000-000000000001');
    expect(Number.isInteger(id)).toBe(true);
    expect(id).toBeGreaterThan(0);
    expect(id).toBeLessThanOrEqual(2 ** 31);
    expect(notificationId('3f2b6c1e-0000-4000-8000-000000000001')).toBe(id);
    expect(notificationId('3f2b6c1e-0000-4000-8000-000000000002')).not.toBe(id);
  });

  it('se dégrade proprement sur le web', async () => {
    const { replaceReminders, checkPermission, cancelAllReminders } = await import('./notifications');
    expect(await checkPermission()).toBe('unsupported');
    expect(
      await replaceReminders([{ intakeId: 'x', at: new Date(Date.now() + 1e6), title: 't', body: 'b' }]),
    ).toBe(-1);
    await expect(cancelAllReminders()).resolves.toBeUndefined();
  });
});
