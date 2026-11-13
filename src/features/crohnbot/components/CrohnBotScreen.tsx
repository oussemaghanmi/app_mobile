import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useCrohnBot } from '../hooks';

const SUGGESTIONS = ['fatigue', 'food', 'tobacco', 'consultation'] as const;

/** Assistant CrohnBot : chat compatible RTL avec avertissement médical permanent. */
export default function CrohnBotScreen() {
  const { t } = useTranslation();
  const { messages, pending, remaining, notice, send, reset } = useCrohnBot();
  const [draft, setDraft] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'end' });
  }, [messages, pending]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    send(draft);
    setDraft('');
  };

  const noticeText = (() => {
    if (!notice) return null;
    if (notice.kind === 'truncated') return t('bot.truncated');
    if (notice.kind === 'refused') return t('bot.refused');
    return t(`bot.errors.${notice.reason}`);
  })();

  return (
    <div className="flex min-h-[calc(100dvh-6rem)] flex-col gap-3 p-4">
      <ScreenHeader
        title={t('bot.title')}
        subtitle={t('bot.subtitle')}
        action={
          messages.length > 0 ? (
            <button className="min-h-11 px-2 text-sm text-sage-dark underline" onClick={reset}>
              {t('bot.newChat')}
            </button>
          ) : undefined
        }
      />

      <p
        role="note"
        className="sticky top-0 z-10 rounded-xl border border-terracotta/30 bg-cream px-3 py-2 text-sm"
      >
        ⚕️ {t('bot.disclaimer')}
      </p>

      <div className="flex flex-1 flex-col gap-2" aria-live="polite" aria-busy={pending}>
        {messages.length === 0 && (
          <div className="card">
            <p>{t('bot.welcome')}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  className="min-h-11 rounded-full border border-sage/50 px-3 text-start text-sm text-sage-dark"
                  onClick={() => send(t(`bot.suggestions.${s}`))}
                >
                  {t(`bot.suggestions.${s}`)}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[85%] rounded-2xl px-4 py-2 leading-relaxed whitespace-pre-line ${
              m.role === 'user'
                ? 'self-end rounded-ee-sm bg-sage text-white'
                : 'self-start rounded-es-sm bg-white shadow-sm'
            }`}
          >
            <span className="sr-only">{m.role === 'user' ? t('bot.you') : t('bot.title')} : </span>
            {m.content}
          </div>
        ))}
        {pending && (
          <div role="status" className="self-start rounded-2xl bg-white px-4 py-2 text-ink/60 shadow-sm">
            {t('bot.thinking')}
          </div>
        )}
        {noticeText && (
          <p role="alert" className="rounded-xl bg-terracotta/10 px-3 py-2 text-sm text-terracotta">
            {noticeText}
          </p>
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={submit} className="sticky bottom-24 flex items-end gap-2 bg-cream pt-2">
        <label htmlFor="bot-input" className="sr-only">
          {t('bot.placeholder')}
        </label>
        <textarea
          id="bot-input"
          rows={1}
          maxLength={2000}
          className="input max-h-32 min-h-11 flex-1 resize-none"
          placeholder={t('bot.placeholder')}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              e.currentTarget.form?.requestSubmit();
            }
          }}
          disabled={remaining === 0}
        />
        <button
          className="btn h-11 w-11 shrink-0 p-0"
          aria-label={t('bot.send')}
          disabled={pending || !draft.trim() || remaining === 0}
        >
          <span aria-hidden className="inline-block rtl:-scale-x-100">
            ➤
          </span>
        </button>
      </form>
      {remaining !== null && (
        <p className="-mt-2 text-center text-xs text-ink/60">{t('bot.remaining', { count: remaining })}</p>
      )}
    </div>
  );
}
