// Edge Function CrohnBot : vérifie le JWT, applique le quota quotidien, appelle l'API Claude.
// N'envoie au modèle QUE le message et l'historique de la conversation : aucune donnée de santé,
// jamais le journal privé. Secrets : ANTHROPIC_API_KEY (obligatoire), CROHNBOT_MODEL (optionnel).
import Anthropic from 'npm:@anthropic-ai/sdk@1.8.0';
import { createClient } from 'npm:@supabase/supabase-js@2.119.0';
import { LANGS, systemPrompt, type Lang } from './prompt.ts';

const MODEL = Deno.env.get('CROHNBOT_MODEL') || 'claude-haiku-5-5';
const DAILY_LIMIT = 30;
const MAX_HISTORY = 20; // messages conservés (le reste est ignoré côté client et serveur)
const MAX_CHARS = 2000; // par message

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/** Valide et normalise le corps de la requête ; renvoie null s'il est invalide. */
export function parseBody(body: unknown): { lang: Lang; messages: ChatMessage[] } | null {
  if (!body || typeof body !== 'object') return null;
  const { lang, messages } = body as { lang?: unknown; messages?: unknown };
  if (!LANGS.includes(lang as Lang) || !Array.isArray(messages) || messages.length === 0) return null;
  const clean: ChatMessage[] = [];
  for (const m of messages.slice(-MAX_HISTORY)) {
    if (!m || (m.role !== 'user' && m.role !== 'assistant') || typeof m.content !== 'string') return null;
    const content = m.content.trim().slice(0, MAX_CHARS);
    if (content) clean.push({ role: m.role, content });
  }
  // L'historique doit commencer et finir par un message de l'utilisateur.
  while (clean.length && clean[0].role !== 'user') clean.shift();
  if (!clean.length || clean[clean.length - 1].role !== 'user') return null;
  return { lang: lang as Lang, messages: clean };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' });

  // 1. Authentification : le client Supabase agit avec le JWT de l'utilisateur (RLS appliqué).
  const authHeader = req.headers.get('Authorization') ?? '';
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: authError } = await supabase.auth.getUser(
    authHeader.replace(/^Bearer /, ''),
  );
  if (authError || !userData.user) return json(401, { error: 'unauthorized' });

  // 2. Validation de la requête.
  let payload: ReturnType<typeof parseBody>;
  try {
    payload = parseBody(await req.json());
  } catch {
    payload = null;
  }
  if (!payload) return json(400, { error: 'invalid_request' });

  // 3. Quota quotidien (incrément atomique en base, avec le JWT de l'utilisateur).
  const { data: remaining, error: quotaError } = await supabase.rpc('consume_chatbot_quota', {
    p_limit: DAILY_LIMIT,
  });
  if (quotaError) return json(500, { error: 'quota_unavailable' });
  if (remaining === -1) return json(429, { error: 'daily_limit', remaining: 0 });

  // 4. Appel du modèle : uniquement le prompt système et la conversation.
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) return json(503, { error: 'not_configured' });
  const anthropic = new Anthropic({ apiKey, maxRetries: 2, timeout: 60_000 });

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 2048,
      output_config: { effort: 'low' }, // conversation courte : réponses rapides et peu coûteuses
      system: systemPrompt(payload.lang),
      messages: payload.messages,
    });

    if (response.stop_reason === 'refusal') return json(200, { reply: null, refused: true, remaining });
    const reply = response.content
      .flatMap((block) => (block.type === 'text' ? [block.text] : []))
      .join('\n')
      .trim();
    return json(200, { reply, truncated: response.stop_reason === 'max_tokens', remaining });
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) return json(503, { error: 'busy', remaining });
    if (error instanceof Anthropic.AuthenticationError)
      return json(503, { error: 'not_configured', remaining });
    if (error instanceof Anthropic.APIError) return json(502, { error: 'upstream', remaining });
    return json(502, { error: 'upstream', remaining });
  }
});
