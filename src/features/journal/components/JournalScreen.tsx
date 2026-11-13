import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Tabs } from '@/components/ui/Tabs';
import { AsyncView } from '@/components/AsyncView';
import { useAuth } from '@/features/auth/AuthProvider';
import { intlLocale } from '@/lib/format';
import * as api from '../api';
import { usePrivateEntries, useSymptomLogs } from '../hooks';
import { SymptomForm } from './SymptomForm';

type Tab = 'symptoms' | 'private';

/** Journal : symptômes (partagés avec l'équipe soignante) et journal privé (patient seul). */
export default function JournalScreen() {
  const { t, i18n } = useTranslation();
  const { profile } = useAuth();
  const [tab, setTab] = useState<Tab>('symptoms');
  const logs = useSymptomLogs();
  const entries = usePrivateEntries(tab === 'private');
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const fmt = (iso: string) =>
    new Date(iso).toLocaleString(intlLocale(i18n.language), {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });

  if (!profile) return null;

  const removeLog = async (id: string) => {
    if (!confirm(t('journal.confirmDelete'))) return;
    await api.deleteSymptomLog(id);
    logs.reload();
  };
  const removeEntry = async (id: string) => {
    if (!confirm(t('journal.confirmDelete'))) return;
    await api.deletePrivateEntry(id);
    entries.reload();
  };
  const addEntry = async (e: FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    setBusy(true);
    try {
      await api.addPrivateEntry(profile.id, draft);
      setDraft('');
      entries.reload();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <ScreenHeader title={t('sections.journal')} />
      <Tabs
        label={t('journal.tabsLabel')}
        active={tab}
        onChange={setTab}
        tabs={[
          { key: 'symptoms', label: `🩺 ${t('journal.tabs.symptoms')}` },
          { key: 'private', label: `🔒 ${t('journal.tabs.private')}` },
        ]}
      >
        {tab === 'symptoms' ? (
          <div className="flex flex-col gap-3">
            <p role="note" className="rounded-xl bg-sage/10 px-3 py-2 text-sm">
              👁️ {t('journal.symptoms.visibility')}
            </p>
            <SymptomForm
              onSubmit={async (input) => {
                await api.addSymptomLog(profile.id, input);
                logs.reload();
              }}
            />
            <h2 className="mt-2 text-lg">{t('journal.history')}</h2>
            <AsyncView state={logs} isEmpty={(l) => l.length === 0} empty={t('journal.symptoms.empty')}>
              {(list) => (
                <ul className="flex flex-col gap-2">
                  {list.map((l) => (
                    <li key={l.id} className="card">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm text-ink/60">{fmt(l.logged_at)}</p>
                        <button
                          className="-mt-2 -me-2 h-11 w-11 shrink-0 rounded-full text-terracotta"
                          aria-label={t('journal.deleteEntry')}
                          onClick={() => removeLog(l.id)}
                        >
                          🗑
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2 text-sm">
                        <span className="rounded-full bg-terracotta/10 px-2 py-0.5">
                          {t('journal.symptoms.painShort', { value: l.pain_level ?? 0 })}
                        </span>
                        <span className="rounded-full bg-sage/15 px-2 py-0.5">
                          {t('journal.symptoms.stoolsShort', { value: l.stools_per_day ?? 0 })}
                        </span>
                        {l.on_period && (
                          <span className="rounded-full bg-cream px-2 py-0.5">
                            🌸 {t('journal.symptoms.periodShort')}
                          </span>
                        )}
                      </div>
                      {l.notes && <p className="mt-1 whitespace-pre-line">{l.notes}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </AsyncView>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p role="note" className="rounded-xl bg-ink/5 px-3 py-2 text-sm">
              🔒 {t('journal.private.visibility')}
            </p>
            <form onSubmit={addEntry} className="card flex flex-col gap-2">
              <label htmlFor="private-entry" className="text-sm font-medium">
                {t('journal.private.newEntry')}
              </label>
              <textarea
                id="private-entry"
                className="input"
                rows={4}
                maxLength={10000}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={t('journal.private.placeholder')}
              />
              <button className="btn min-h-11 self-end" disabled={busy || !draft.trim()}>
                {t('settings.save')}
              </button>
            </form>
            <AsyncView state={entries} isEmpty={(l) => l.length === 0} empty={t('journal.private.empty')}>
              {(list) => (
                <ul className="flex flex-col gap-2">
                  {list.map((e) => (
                    <li key={e.id} className="card">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm text-ink/60">{fmt(e.created_at)}</p>
                        <button
                          className="-mt-2 -me-2 h-11 w-11 shrink-0 rounded-full text-terracotta"
                          aria-label={t('journal.deleteEntry')}
                          onClick={() => removeEntry(e.id)}
                        >
                          🗑
                        </button>
                      </div>
                      <p className="whitespace-pre-line">{e.content}</p>
                    </li>
                  ))}
                </ul>
              )}
            </AsyncView>
          </div>
        )}
      </Tabs>
    </div>
  );
}
