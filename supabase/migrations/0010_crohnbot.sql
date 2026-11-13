-- =============================================================
-- 0010 — CrohnBot : quota quotidien de messages
-- L'Edge Function appelle consume_chatbot_quota() avec le JWT de l'utilisateur :
-- incrément atomique, limite de 30 messages par jour (fuseau Africa/Tunis).
-- Aucune donnée de conversation n'est stockée en base.
-- =============================================================

create table public.chatbot_usage (
  user_id  uuid not null references public.profiles(id) on delete cascade,
  day      date not null,
  messages int not null default 0 check (messages >= 0),
  primary key (user_id, day)
);

alter table public.chatbot_usage enable row level security;

-- Chacun voit sa consommation ; aucune écriture directe (ni remise à zéro possible).
create policy chatbot_usage_read on public.chatbot_usage for select using (user_id = auth.uid());
revoke insert, update, delete on public.chatbot_usage from anon, authenticated;

-- Réserve un message pour l'utilisateur connecté. Renvoie le nombre de messages restants
-- après celui-ci, ou -1 si la limite quotidienne est déjà atteinte (rien n'est alors compté).
create function public.consume_chatbot_quota(p_limit int default 30) returns int
language plpgsql security definer set search_path = public as $$
declare
  v_uid   uuid := auth.uid();
  v_day   date := (now() at time zone 'Africa/Tunis')::date;
  v_count int;
begin
  if v_uid is null then raise exception 'not authenticated' using errcode = '42501'; end if;
  if p_limit is null or p_limit < 1 or p_limit > 30 then
    raise exception 'limite invalide' using errcode = '22023';
  end if;

  insert into public.chatbot_usage (user_id, day, messages) values (v_uid, v_day, 1)
  on conflict (user_id, day) do update set messages = chatbot_usage.messages + 1
    where chatbot_usage.messages < p_limit
  returning messages into v_count;

  if v_count is null then return -1; end if;  -- limite atteinte : la mise à jour a été filtrée
  return p_limit - v_count;
end $$;
revoke all on function public.consume_chatbot_quota(int) from public, anon;
grant execute on function public.consume_chatbot_quota(int) to authenticated;
