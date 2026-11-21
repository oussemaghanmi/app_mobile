// Tests de l'Edge Function CrohnBot, sans réseau externe ni clé réelle :
// la fonction parle à de FAUX serveurs locaux (Supabase Auth/RPC et API Messages d'Anthropic).
// Lancer : deno test --allow-net --allow-env supabase/functions/crohnbot/
import assert from 'node:assert/strict';

type Handler = (req: Request) => Response | Promise<Response>;

// ---------- Faux serveur Supabase : auth + quota ----------
const USER = { id: 'user-id-0001', aud: 'authenticated', role: 'authenticated', email: 'patiente.secrete@example.test' };
const GOOD_JWT = 'jwt-valide-0001';
const LIMIT = 30;
const supabaseState = { quotaCalls: 0, quotaFails: false };
const fakeSupabase = Deno.serve({ port: 0, onListen() {} }, (req) => {
  const url = new URL(req.url);
  if (url.pathname === '/auth/v1/user') {
    return req.headers.get('authorization') === `Bearer ${GOOD_JWT}`
      ? Response.json(USER)
      : Response.json({ msg: 'invalid JWT' }, { status: 401 });
  }
  if (url.pathname === '/rest/v1/rpc/consume_chatbot_quota') {
    if (supabaseState.quotaFails) return Response.json({ message: 'boom' }, { status: 500 });
    supabaseState.quotaCalls += 1;
    return Response.json(supabaseState.quotaCalls > LIMIT ? -1 : LIMIT - supabaseState.quotaCalls);
  }
  return new Response('not found', { status: 404 });
});

// ---------- Faux serveur API Messages ----------
type Reply = { status: number; body: Record<string, unknown>; headers?: Record<string, string> };
const textMessage = (stop_reason: string, text = 'Réponse de test'): Reply => ({
  status: 200,
  body: {
    id: 'msg_test', type: 'message', role: 'assistant', model: 'test-model',
    content: [{ type: 'text', text }], stop_reason, stop_sequence: null,
    usage: { input_tokens: 1, output_tokens: 1 },
  },
});
const anthropicState: { next: Reply; received: Record<string, unknown>[] } = { next: textMessage('end_turn'), received: [] };
const fakeAnthropic = Deno.serve({ port: 0, onListen() {} }, async (req) => {
  if (new URL(req.url).pathname !== '/v1/messages') return new Response('not found', { status: 404 });
  anthropicState.received.push(await req.json());
  const { status, body, headers } = anthropicState.next;
  // x-should-retry: false évite que le SDK réessaie (et ralentisse le test) sur les erreurs simulées.
  return Response.json(body, { status, headers: { 'x-should-retry': 'false', ...headers } });
});

// ---------- Charger la fonction en capturant son handler (le code de production n'est pas modifié) ----------
Deno.env.set('SUPABASE_URL', `http://127.0.0.1:${fakeSupabase.addr.port}`);
Deno.env.set('SUPABASE_ANON_KEY', 'anon-key-de-test');
Deno.env.set('ANTHROPIC_API_KEY', 'cle-de-test');
Deno.env.set('ANTHROPIC_BASE_URL', `http://127.0.0.1:${fakeAnthropic.addr.port}`);
Deno.env.delete('CROHNBOT_MODEL');
let handler!: Handler;
(Deno as unknown as { serve: unknown }).serve = (h: Handler) => {
  handler = h;
  return { finished: Promise.resolve(), shutdown: () => Promise.resolve(), ref() {}, unref() {}, addr: { port: 0 } };
};
const { parseBody } = await import('./index.ts');

// ---------- Aides ----------
const call = (opts: { method?: string; jwt?: string | null; body?: unknown } = {}) => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (opts.jwt !== null) headers.Authorization = `Bearer ${opts.jwt ?? GOOD_JWT}`;
  return handler(new Request('http://localhost/crohnbot', {
    method: opts.method ?? 'POST',
    headers,
    body: opts.method === 'GET' || opts.method === 'OPTIONS' ? undefined : JSON.stringify('body' in opts ? opts.body : valid),
  }));
};
const valid = { lang: 'fr', messages: [{ role: 'user', content: 'Que manger pendant une poussée ?' }] };
const reset = () => {
  supabaseState.quotaCalls = 0;
  supabaseState.quotaFails = false;
  anthropicState.next = textMessage('end_turn');
  anthropicState.received = [];
  Deno.env.set('ANTHROPIC_API_KEY', 'cle-de-test');
};
const t = (name: string, fn: () => Promise<void> | void) =>
  Deno.test({ name, sanitizeOps: false, sanitizeResources: false, fn: async () => { reset(); await fn(); } });

// ---------- Authentification et méthodes ----------
t('OPTIONS répond aux pré-requêtes CORS', async () => {
  const res = await call({ method: 'OPTIONS' });
  assert.equal(res.status, 200);
  assert.ok(res.headers.get('access-control-allow-headers')?.includes('authorization'));
});
t('une méthode autre que POST est refusée (405)', async () => {
  assert.equal((await call({ method: 'GET' })).status, 405);
});
t('sans JWT : 401, et aucun appel au modèle ni au quota', async () => {
  const res = await call({ jwt: null });
  assert.equal(res.status, 401);
  assert.equal(anthropicState.received.length, 0);
  assert.equal(supabaseState.quotaCalls, 0);
});
t('JWT invalide : 401', async () => {
  const res = await call({ jwt: 'faux' });
  assert.equal(res.status, 401);
  assert.equal(anthropicState.received.length, 0);
});

// ---------- Validation du corps ----------
for (const [name, body] of Object.entries({
  'langue inconnue': { lang: 'xx', messages: valid.messages },
  'liste de messages vide': { lang: 'fr', messages: [] },
  'dernier message de l\'assistant': { lang: 'fr', messages: [{ role: 'user', content: 'a' }, { role: 'assistant', content: 'b' }] },
  'rôle inconnu': { lang: 'fr', messages: [{ role: 'system', content: 'a' }] },
  'contenu qui n\'est pas du texte': { lang: 'fr', messages: [{ role: 'user', content: 42 }] },
  'messages vides ou blancs': { lang: 'fr', messages: [{ role: 'user', content: '   ' }] },
  'corps absent': null,
})) {
  t(`corps invalide (${name}) : 400, sans consommer le quota`, async () => {
    const res = await call({ body });
    assert.equal(res.status, 400);
    assert.equal(supabaseState.quotaCalls, 0);
    assert.equal(anthropicState.received.length, 0);
  });
}
t('un corps qui n\'est pas du JSON : 400', async () => {
  const res = await handler(new Request('http://localhost/crohnbot', {
    method: 'POST', headers: { Authorization: `Bearer ${GOOD_JWT}` }, body: '{pas du json',
  }));
  assert.equal(res.status, 400);
});
t('parseBody : garde les 20 derniers messages, coupe à 2 000 caractères, commence par l\'utilisateur', () => {
  const many = Array.from({ length: 30 }, (_, i) => ({ role: i % 2 === 0 ? 'user' : 'assistant', content: `m${i}` }));
  many.push({ role: 'user', content: 'x'.repeat(5000) });
  const parsed = parseBody({ lang: 'ar', messages: many })!;
  assert.ok(parsed.messages.length <= 20);
  assert.equal(parsed.messages[0].role, 'user');
  assert.equal(parsed.messages.at(-1)!.content.length, 2000);
});

// ---------- Réponse nominale et confidentialité ----------
t('requête valide : 200, réponse du modèle et messages restants', async () => {
  const res = await call();
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { reply: 'Réponse de test', truncated: false, remaining: LIMIT - 1 });
  assert.equal(supabaseState.quotaCalls, 1);
});
t('CONFIDENTIALITÉ : le modèle ne reçoit que la conversation (ni identité, ni e-mail, ni JWT, ni journal)', async () => {
  await call();
  assert.equal(anthropicState.received.length, 1);
  const sent = anthropicState.received[0];
  assert.deepEqual(Object.keys(sent).sort(), ['max_tokens', 'messages', 'model', 'output_config', 'system']);
  assert.deepEqual(sent.messages, valid.messages);
  assert.equal(sent.model, 'claude-haiku-5-5');
  assert.equal('temperature' in sent, false);
  const wire = JSON.stringify(sent).toLowerCase();
  for (const secret of [USER.email, USER.id, GOOD_JWT, 'private_journal', 'anon-key-de-test', 'cle-de-test']) {
    assert.equal(wire.includes(secret.toLowerCase()), false, `le modèle ne doit pas recevoir « ${secret} »`);
  }
});
t('le prompt système suit la langue demandée', async () => {
  await call({ body: { lang: 'tn', messages: valid.messages } });
  const tn = String(anthropicState.received[0].system);
  anthropicState.received = [];
  await call({ body: { lang: 'en', messages: valid.messages } });
  assert.notEqual(String(anthropicState.received[0].system), tn);
});

// ---------- Quota ----------
t('quota : 30 messages passent, le 31e est refusé (429 daily_limit) sans appeler le modèle', async () => {
  for (let i = 1; i <= LIMIT; i++) assert.equal((await call()).status, 200, `message ${i}`);
  assert.equal(anthropicState.received.length, LIMIT);
  const res = await call();
  assert.equal(res.status, 429);
  assert.deepEqual(await res.json(), { error: 'daily_limit', remaining: 0 });
  assert.equal(anthropicState.received.length, LIMIT);
});
t('quota indisponible : 500 quota_unavailable, le modèle n\'est pas appelé', async () => {
  supabaseState.quotaFails = true;
  const res = await call();
  assert.equal(res.status, 500);
  assert.equal(anthropicState.received.length, 0);
});

// ---------- Réponses et erreurs du modèle ----------
t('refus du modèle : reply null et refused true', async () => {
  anthropicState.next = textMessage('refusal', '');
  assert.deepEqual(await (await call()).json(), { reply: null, refused: true, remaining: LIMIT - 1 });
});
t('réponse tronquée : truncated true', async () => {
  anthropicState.next = textMessage('max_tokens');
  assert.equal((await (await call()).json()).truncated, true);
});
for (const [name, status, expected, error] of [
  ['clé refusée par l\'API', 401, 503, 'not_configured'],
  ['API surchargée (limite de débit)', 429, 503, 'busy'],
  ['erreur de l\'API', 500, 502, 'upstream'],
] as const) {
  t(`${name} : ${expected} ${error}`, async () => {
    anthropicState.next = { status, body: { type: 'error', error: { type: 'api_error', message: 'simulé' } } };
    const res = await call();
    assert.equal(res.status, expected);
    assert.equal((await res.json()).error, error);
  });
}
t('clé API absente : 503 not_configured', async () => {
  Deno.env.delete('ANTHROPIC_API_KEY');
  const res = await call();
  assert.equal(res.status, 503);
  assert.equal((await res.json()).error, 'not_configured');
  assert.equal(anthropicState.received.length, 0);
});

// ---------- Sortie ----------
globalThis.addEventListener('unload', () => { fakeSupabase.shutdown(); fakeAnthropic.shutdown(); });
