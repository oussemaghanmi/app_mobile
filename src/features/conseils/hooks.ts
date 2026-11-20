import { useAsync } from '@/lib/useAsync';
import { fetchTips } from './api';

export const useTips = () => useAsync(fetchTips, []);
