import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { AsyncView } from '@/components/AsyncView';
import { useAuth } from '@/features/auth/AuthProvider';
import { createPost } from '../api';
import { useMyPseudonym, usePosts } from '../hooks';
import { PostCard } from './PostCard';
import { PseudonymSetup } from './PseudonymSetup';

/** Communauté entre patients : affichage sous pseudonyme uniquement. */
export default function CommunityScreen() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const pseudonym = useMyPseudonym(profile?.id);
  const posts = usePosts();
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const canWrite = profile?.role === 'patient' && !!pseudonym.data;

  const publish = async (e: FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    setBusy(true);
    setError(false);
    try {
      await createPost(draft);
      setDraft('');
      posts.reload();
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <ScreenHeader title={t('sections.community')} subtitle={t('community.subtitle')} />
      <p role="note" className="rounded-xl bg-sage/10 px-3 py-2 text-sm">
        🛡️ {t('community.rules')}
      </p>

      {profile?.role === 'patient' && !pseudonym.loading && !pseudonym.data && (
        <PseudonymSetup onDone={pseudonym.reload} />
      )}

      {canWrite && (
        <form onSubmit={publish} className="card flex flex-col gap-2">
          <label htmlFor="new-post" className="text-sm font-medium">
            {t('community.postAs', { pseudonym: pseudonym.data })}
          </label>
          <textarea
            id="new-post"
            className="input"
            rows={3}
            maxLength={2000}
            placeholder={t('community.postPlaceholder')}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          {error && (
            <p role="alert" className="text-sm text-terracotta">
              {t('common.error')}
            </p>
          )}
          <button className="btn min-h-11 self-end" disabled={busy || !draft.trim()}>
            {t('community.publish')}
          </button>
        </form>
      )}

      <AsyncView state={posts} isEmpty={(l) => l.length === 0} empty={t('community.empty')}>
        {(list) => (
          <div className="flex flex-col gap-3">
            {list.map((p) => (
              <PostCard
                key={p.id}
                post={p}
                currentUserId={profile?.id ?? ''}
                canWrite={canWrite}
                onChanged={posts.reload}
              />
            ))}
          </div>
        )}
      </AsyncView>
    </div>
  );
}
