import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { askCrohnBot } from './api';
import type { BotResult, ChatMessage } from './types';

/**
 * Conversation CrohnBot gardée en mémoire seulement (jamais enregistrée en base ni sur le téléphone).
 */
export function useCrohnBot() {
  const { i18n } = useTranslation();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pending, setPending] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [notice, setNotice] = useState<Exclude<BotResult, { kind: 'reply' }> | { kind: 'truncated' } | null>(
    null,
  );

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || pending) return;
    const next: ChatMessage[] = [...messages, { role: 'user', content }];
    setMessages(next);
    setPending(true);
    setNotice(null);
    const result = await askCrohnBot(next, i18n.language);
    setPending(false);
    if (result.kind === 'reply') {
      setMessages([...next, { role: 'assistant', content: result.text }]);
      setRemaining(result.remaining);
      if (result.truncated) setNotice({ kind: 'truncated' });
    } else {
      if (result.kind === 'refused') setRemaining(result.remaining);
      if (result.kind === 'error' && result.reason === 'daily_limit') setRemaining(0);
      setNotice(result);
    }
  };

  const reset = () => {
    setMessages([]);
    setNotice(null);
  };

  return { messages, pending, remaining, notice, send, reset };
}
