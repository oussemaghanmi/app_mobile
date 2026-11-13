import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { BotResult, ChatMessage } from './types';

/** Historique envoyé : seulement la conversation (aucune donnée de santé), 20 derniers messages. */
const HISTORY = 20;

interface BotResponse {
  reply?: string | null;
  refused?: boolean;
  truncated?: boolean;
  remaining?: number;
  error?: string;
}

export async function askCrohnBot(messages: ChatMessage[], lang: string): Promise<BotResult> {
  const { data, error } = await supabase.functions.invoke<BotResponse>('crohnbot', {
    body: { lang, messages: messages.slice(-HISTORY) },
  });
  if (error) {
    if (error instanceof FunctionsHttpError) {
      const body = (await error.context.json().catch(() => ({}))) as BotResponse;
      if (body.error === 'daily_limit') return { kind: 'error', reason: 'daily_limit' };
      if (body.error === 'not_configured') return { kind: 'error', reason: 'not_configured' };
      if (body.error === 'busy') return { kind: 'error', reason: 'busy' };
      return { kind: 'error', reason: 'unknown' };
    }
    return { kind: 'error', reason: 'network' };
  }
  if (!data) return { kind: 'error', reason: 'unknown' };
  if (data.refused) return { kind: 'refused', remaining: data.remaining ?? 0 };
  return {
    kind: 'reply',
    text: data.reply ?? '',
    remaining: data.remaining ?? 0,
    truncated: !!data.truncated,
  };
}
