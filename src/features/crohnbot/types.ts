export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export type BotResult =
  | { kind: 'reply'; text: string; remaining: number; truncated: boolean }
  | { kind: 'refused'; remaining: number }
  | { kind: 'error'; reason: 'daily_limit' | 'not_configured' | 'busy' | 'network' | 'unknown' };
