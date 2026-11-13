begin;
create extension if not exists pgtap with schema extensions;
select plan(7);

insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-00000000000a', 'a@t.l', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-00000000000b', 'b@t.l', 'authenticated', 'authenticated');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
set local role authenticated;
select is(public.consume_chatbot_quota(), 29, 'premier message : 29 restants');
select is((select max(r) from (select public.consume_chatbot_quota() as r from generate_series(1, 28)) s), 28,
  '28 messages de plus');
select is(public.consume_chatbot_quota(), 0, '30e message : 0 restant');
select is(public.consume_chatbot_quota(), -1, '31e message : refusé');
select is((select messages from public.chatbot_usage), 30, 'le compteur reste plafonné à 30');
select throws_ok($$ update public.chatbot_usage set messages = 0 $$, '42501', null, 'remise à zéro impossible');
reset role;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
set local role authenticated;
select is((select count(*)::int from public.chatbot_usage), 0, 'B ne voit pas la consommation de A');
reset role;

select * from finish();
rollback;
