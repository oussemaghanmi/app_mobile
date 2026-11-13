import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { timeAgo } from '@/lib/format';
import * as api from '../api';
import { useComments } from '../hooks';
import type { Post, ReportTarget } from '../types';
import { ReportForm } from './ReportForm';

interface Props {
  post: Post;
  currentUserId: string;
  canWrite: boolean;
  onChanged: () => void;
}

/** Publication : pseudonyme, contenu, commentaires, signalement, suppression par l'auteur. */
export function PostCard({ post, currentUserId, canWrite, onChanged }: Props) {
  const { t, i18n } = useTranslation();
  const [showComments, setShowComments] = useState(false);
  const [reporting, setReporting] = useState<ReportTarget | null>(null);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const comments = useComments(post.id, showComments);
  const mine = post.author_id === currentUserId;
  const count = post.community_comments[0]?.count ?? 0;

  const remove = async () => {
    if (!confirm(t('community.confirmDelete'))) return;
    await api.deletePost(post.id);
    onChanged();
  };
  const removeComment = async (id: string) => {
    if (!confirm(t('community.confirmDelete'))) return;
    await api.deleteComment(id);
    comments.reload();
  };
  const sendComment = async (e: FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    setBusy(true);
    try {
      await api.createComment(post.id, draft);
      setDraft('');
      comments.reload();
      onChanged();
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="card">
      <header className="flex items-center gap-2">
        <span
          aria-hidden
          className="flex h-9 w-9 items-center justify-center rounded-full bg-sage/20 font-bold text-sage-dark"
        >
          {post.author?.pseudonym.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{post.author?.pseudonym}</p>
          <p className="text-xs text-ink/60">{timeAgo(post.created_at, i18n.language)}</p>
        </div>
        {post.hidden && mine && (
          <span className="rounded-full bg-terracotta/10 px-2 py-0.5 text-xs text-terracotta">
            {t('community.hidden')}
          </span>
        )}
      </header>
      <p className="mt-2 leading-relaxed break-words whitespace-pre-line">{post.content}</p>

      <div className="mt-2 flex flex-wrap gap-1 text-sm">
        <button
          className="min-h-11 rounded-full px-3 text-sage-dark active:bg-sage/10"
          aria-expanded={showComments}
          onClick={() => setShowComments((s) => !s)}
        >
          💬 {t('community.comments', { count })}
        </button>
        {!mine && (
          <button
            className="min-h-11 rounded-full px-3 text-ink/60 active:bg-terracotta/10"
            onClick={() => setReporting({ postId: post.id })}
          >
            ⚑ {t('community.report.action')}
          </button>
        )}
        {mine && (
          <button className="min-h-11 rounded-full px-3 text-terracotta" onClick={remove}>
            🗑 {t('community.delete')}
          </button>
        )}
      </div>

      {reporting && 'postId' in reporting && (
        <ReportForm target={reporting} onClose={() => setReporting(null)} />
      )}

      {showComments && (
        <div className="mt-2 border-t border-black/5 pt-2">
          <ul className="flex flex-col gap-2">
            {(comments.data ?? []).map((c) => (
              <li key={c.id} className="rounded-xl bg-cream p-2 text-sm">
                <p>
                  <span className="font-medium">{c.author?.pseudonym}</span>
                  <span className="ms-2 text-xs text-ink/60">{timeAgo(c.created_at, i18n.language)}</span>
                </p>
                <p className="break-words whitespace-pre-line">{c.content}</p>
                <div className="flex gap-1">
                  {c.author_id === currentUserId ? (
                    <button
                      className="min-h-11 px-2 text-xs text-terracotta"
                      onClick={() => removeComment(c.id)}
                    >
                      {t('community.delete')}
                    </button>
                  ) : (
                    <button
                      className="min-h-11 px-2 text-xs text-ink/60"
                      onClick={() => setReporting({ commentId: c.id })}
                    >
                      {t('community.report.action')}
                    </button>
                  )}
                </div>
                {reporting && 'commentId' in reporting && reporting.commentId === c.id && (
                  <ReportForm target={reporting} onClose={() => setReporting(null)} />
                )}
              </li>
            ))}
          </ul>
          {canWrite && (
            <form onSubmit={sendComment} className="mt-2 flex gap-2">
              <label className="sr-only" htmlFor={`comment-${post.id}`}>
                {t('community.commentPlaceholder')}
              </label>
              <input
                id={`comment-${post.id}`}
                className="input min-h-11 flex-1"
                placeholder={t('community.commentPlaceholder')}
                maxLength={1000}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
              <button className="btn min-h-11" disabled={busy || !draft.trim()}>
                {t('community.send')}
              </button>
            </form>
          )}
        </div>
      )}
    </article>
  );
}
