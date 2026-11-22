import { beforeEach, describe, expect, it, vi } from 'vitest';

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock('@/lib/supabase', () => ({ supabase: { rpc } }));

import { exportMyData } from './api';

describe('exportMyData', () => {
  beforeEach(() => rpc.mockReset());

  it('fait un seul appel RPC export_my_data et renvoie son JSON', async () => {
    rpc.mockResolvedValueOnce({ data: { profiles: [] }, error: null });
    await expect(exportMyData()).resolves.toEqual({ profiles: [] });
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith('export_my_data');
  });

  it('lève une erreur si la base renvoie une erreur (jamais un export vide silencieux)', async () => {
    rpc.mockResolvedValueOnce({ data: null, error: { message: 'permission denied', code: '42501' } });
    await expect(exportMyData()).rejects.toThrow('permission denied');
  });
});
