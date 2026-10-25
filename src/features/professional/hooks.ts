import { useAsync } from '@/lib/useAsync';
import * as api from './api';

export function useAssignedPatients(professionalId: string | undefined) {
  return useAsync(
    () => (professionalId ? api.fetchAssignedPatients(professionalId) : Promise.resolve([])),
    [professionalId],
  );
}
