import { useAsync } from '@/lib/useAsync';
import * as api from './api';

export const useSymptomLogs = () => useAsync(() => api.fetchSymptomLogs(), []);
export const usePrivateEntries = (enabled: boolean) =>
  useAsync(() => (enabled ? api.fetchPrivateEntries() : Promise.resolve([])), [enabled]);
