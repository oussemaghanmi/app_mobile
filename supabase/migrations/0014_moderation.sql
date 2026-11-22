-- =============================================================
-- CronCare — modération de la communauté (0014)
-- Le déclencheur auto_hide_reported (0006) masque un contenu à 3 signalements ; la modération humaine
-- tranche ensuite avec ces fonctions : lister, remettre en ligne, supprimer.
-- Réservées à service_role (ou au SQL Editor de Supabase), jamais à anon ni authenticated : même schéma
-- de droits que 0012. Les personnes qui signalent restent anonymes : reporter_id n'est jamais renvoyé,
-- et l'auteur n'apparaît que sous son pseudonyme.
-- =============================================================

-- Un enregistrement par contenu signalé, le plus récemment signalé d'abord.
create function public.admin_list_reports()
returns table (kind text, content_id uuid, content text, hidden boolean, author_pseudonym text,
               reason text, report_count bigint, last_reported_at timestamptz)
language sql stable security definer set search_path = public as $$
  select 'post'::text, p.id, p.content, p.hidden, cp.pseudonym,
         string_agg(distinct r.reason, ', ' order by r.reason), count(*), max(r.created_at)
    from public.reports r
    join public.community_posts p on p.id = r.post_id
    join public.community_profiles cp on cp.user_id = p.author_id
   group by p.id, p.content, p.hidden, cp.pseudonym
  union all
  select 'comment'::text, c.id, c.content, c.hidden, cp.pseudonym,
         string_agg(distinct r.reason, ', ' order by r.reason), count(*), max(r.created_at)
    from public.reports r
    join public.community_comments c on c.id = r.comment_id
    join public.community_profiles cp on cp.user_id = c.author_id
   group by c.id, c.content, c.hidden, cp.pseudonym
  order by 8 desc
$$;

-- Remet un contenu en ligne et efface ses signalements (sinon le prochain signalement le masquerait aussitôt).
create function public.admin_restore_content(p_kind text, p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_kind = 'post' then
    update public.community_posts set hidden = false where id = p_id;
    if not found then raise exception 'admin_restore_content : publication inconnue (%)', p_id; end if;
    delete from public.reports where post_id = p_id;
  elsif p_kind = 'comment' then
    update public.community_comments set hidden = false where id = p_id;
    if not found then raise exception 'admin_restore_content : commentaire inconnu (%)', p_id; end if;
    delete from public.reports where comment_id = p_id;
  else
    raise exception 'admin_restore_content : type inconnu (%), attendu post ou comment', p_kind;
  end if;
end $$;

-- Supprime définitivement un contenu abusif (ses signalements et, pour une publication, ses commentaires
-- partent par cascade).
create function public.admin_remove_content(p_kind text, p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_kind = 'post' then
    delete from public.community_posts where id = p_id;
    if not found then raise exception 'admin_remove_content : publication inconnue (%)', p_id; end if;
  elsif p_kind = 'comment' then
    delete from public.community_comments where id = p_id;
    if not found then raise exception 'admin_remove_content : commentaire inconnu (%)', p_id; end if;
  else
    raise exception 'admin_remove_content : type inconnu (%), attendu post ou comment', p_kind;
  end if;
end $$;

revoke execute on function public.admin_list_reports()                from public, anon, authenticated;
revoke execute on function public.admin_restore_content(text, uuid)   from public, anon, authenticated;
revoke execute on function public.admin_remove_content(text, uuid)    from public, anon, authenticated;
grant  execute on function public.admin_list_reports()                to service_role;
grant  execute on function public.admin_restore_content(text, uuid)   to service_role;
grant  execute on function public.admin_remove_content(text, uuid)    to service_role;
