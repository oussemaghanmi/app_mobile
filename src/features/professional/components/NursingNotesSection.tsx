import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { AsyncView } from '@/components/AsyncView';
import { useAuth } from '@/features/auth/AuthProvider';
import { can } from '@/features/auth/permissions';
import type { AsyncState } from '@/lib/useAsync';
import * as api from '../api';
import type { NursingNote } from '../types';

interface Props {
  patientId: string;
  state: AsyncState<NursingNote[]>;
  fmtDate: (iso: string) => string;
}

/** Observations infirmières : historique pour l'équipe, formulaire pour l'infirmier uniquement. */
export function NursingNotesSection({ patientId, state, fmtDate }: Props) {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const canWrite = can(profile?.role, 'nursing_notes:write');
  const [draft, setDraft] = useState('');
  const [status, setStatus] = useState<'idle' | 'busy' | 'saved' | 'error'>('idle');
  const author = (n: NursingNote) => (n.author ? `${n.author.first_name} ${n.author.last_name}`.trim() : '—');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!profile || !draft.trim()) return;
    setStatus('busy');
    try {
      await api.createNursingNote(patientId, profile.id, draft);
      setDraft('');
      setStatus('saved');
      state.reload();
    } catch {
      setStatus('error');
    }
  };

  return (
    <section className="card" aria-labelledby="notes-title">
      <h2 id="notes-title" className="text-lg">
        {t('pro.nursingNotes')}
      </h2>
      {canWrite && (
        <form onSubmit={submit} className="mt-2 flex flex-col gap-2">
          <label htmlFor="nursing-note" className="text-sm font-medium">
            {t('pro.notes.new')}
          </label>
          <textarea
            id="nursing-note"
            className="input"
            rows={3}
            maxLength={4000}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={t('pro.notes.placeholder')}
          />
          <p className="text-xs text-ink/60">{t('pro.notes.immutable')}</p>
          {status === 'saved' && (
            <p role="status" className="text-sm text-sage-dark">
              {t('journal.saved')}
            </p>
          )}
          {status === 'error' && (
            <p role="alert" className="text-sm text-terracotta">
              {t('common.error')}
            </p>
          )}
          <button className="btn min-h-11 self-end" disabled={status === 'busy' || !draft.trim()}>
            {t('settings.save')}
          </button>
        </form>
      )}
      <AsyncView state={state} isEmpty={(l) => l.length === 0} empty={t('pro.notes.empty')}>
        {(list) => (
          <ul className="mt-2 flex flex-col gap-2">
            {list.map((n) => (
              <li key={n.id} className="rounded-xl bg-cream p-3 text-sm">
                <p className="text-xs text-ink/60">
                  {fmtDate(n.created_at)} · {author(n)}
                </p>
                <p className="whitespace-pre-line">{n.content}</p>
              </li>
            ))}
          </ul>
        )}
      </AsyncView>
    </section>
  );
}
