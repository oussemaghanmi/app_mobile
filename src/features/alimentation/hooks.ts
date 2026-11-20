import { useAsync } from '@/lib/useAsync';
import * as api from './api';

export const useRecipes = () => useAsync(api.fetchRecipes, []);
export const useStores = () => useAsync(api.fetchStores, []);
