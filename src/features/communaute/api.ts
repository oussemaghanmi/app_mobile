import { supabase } from '@/lib/supabase';
import { unwrap } from '@/lib/errors';
import type { Comment, Post, ReportReason, ReportTarget } from './types';

// Seul le pseudonyme est joint (community_profiles) — jamais la table profiles (noms réels).
const POST_COLUMNS =
  'id, author_id, content, hidden, created_at, author:community_profiles(pseudonym), community_comments(count)';
const COMMENT_COLUMNS =
  'id, post_id, author_id, content, hidden, created_at, author:community_profiles(pseudonym)';

export async function fetchMyPseudonym(userId: string): Promise<string | null> {
  const row = unwrap(
    await supabase.from('community_profiles').select('pseudonym').eq('user_id', userId).maybeSingle(),
  );
  return row?.pseudonym ?? null;
}

/** Erreur `taken` si le pseudonyme est déjà pris, `invalid` si son format est refusé. */
export async function createPseudonym(pseudonym: string): Promise<'ok' | 'taken' | 'invalid'> {
  const { error } = await supabase.from('community_profiles').insert({ pseudonym: pseudonym.trim() });
  if (!error) return 'ok';
  if (error.code === '23505') return 'taken';
  if (error.code === '23514') return 'invalid';
  throw new Error(error.message);
}

export async function fetchPosts(limit = 50): Promise<Post[]> {
  return (
    unwrap(
      await supabase
        .from('community_posts')
        .select(POST_COLUMNS)
        .order('created_at', { ascending: false })
        .limit(limit),
    ) ?? []
  );
}

export async function createPost(content: string): Promise<void> {
  unwrap(await supabase.from('community_posts').insert({ content: content.trim() }));
}

export async function deletePost(id: string): Promise<void> {
  unwrap(await supabase.from('community_posts').delete().eq('id', id));
}

export async function fetchComments(postId: string): Promise<Comment[]> {
  return (
    unwrap(
      await supabase
        .from('community_comments')
        .select(COMMENT_COLUMNS)
        .eq('post_id', postId)
        .order('created_at'),
    ) ?? []
  );
}

export async function createComment(postId: string, content: string): Promise<void> {
  unwrap(await supabase.from('community_comments').insert({ post_id: postId, content: content.trim() }));
}

export async function deleteComment(id: string): Promise<void> {
  unwrap(await supabase.from('community_comments').delete().eq('id', id));
}

/** Renvoie `already` si l'utilisateur a déjà signalé ce contenu. */
export async function report(
  target: ReportTarget,
  reason: ReportReason,
  details?: string,
): Promise<'ok' | 'already'> {
  const { error } = await supabase.from('reports').insert({
    post_id: 'postId' in target ? target.postId : null,
    comment_id: 'commentId' in target ? target.commentId : null,
    reason,
    details: details?.trim() || null,
  });
  if (!error) return 'ok';
  if (error.code === '23505') return 'already';
  throw new Error(error.message);
}
