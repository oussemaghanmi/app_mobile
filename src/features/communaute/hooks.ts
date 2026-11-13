import { useAsync } from '@/lib/useAsync';
import * as api from './api';

export const useMyPseudonym = (userId: string | undefined) =>
  useAsync(() => (userId ? api.fetchMyPseudonym(userId) : Promise.resolve(null)), [userId]);

export const usePosts = () => useAsync(() => api.fetchPosts(), []);

export const useComments = (postId: string, enabled: boolean) =>
  useAsync(() => (enabled ? api.fetchComments(postId) : Promise.resolve([])), [postId, enabled]);
