-- =============================================================
-- 0006 — Communauté : pseudonymes, publications, commentaires, signalements
-- - Les noms réels (profiles) ne sont JAMAIS joints : seul le pseudonyme est public.
-- - Lecture : tout utilisateur connecté. Écriture : patients, sur leurs propres contenus.
-- - Une publication / un commentaire signalé par 3 personnes est masqué automatiquement
--   (sauf pour son auteur) en attendant la modération (service_role).
-- =============================================================

create table public.community_profiles (
  user_id    uuid primary key references public.profiles(id) on delete cascade default auth.uid(),
  pseudonym  text not null,
  created_at timestamptz not null default now(),
  constraint community_pseudonym_format check (pseudonym ~ '^[[:alnum:]_.\- ]{3,30}$' and pseudonym = btrim(pseudonym))
);
create unique index community_profiles_pseudonym_key on public.community_profiles (lower(pseudonym));

create table public.community_posts (
  id         uuid primary key default gen_random_uuid(),
  author_id  uuid not null default auth.uid() references public.community_profiles(user_id) on delete cascade,
  content    text not null check (char_length(btrim(content)) between 1 and 2000),
  hidden     boolean not null default false,
  created_at timestamptz not null default now()
);
create index on public.community_posts (created_at desc);

create table public.community_comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.community_posts(id) on delete cascade,
  author_id  uuid not null default auth.uid() references public.community_profiles(user_id) on delete cascade,
  content    text not null check (char_length(btrim(content)) between 1 and 1000),
  hidden     boolean not null default false,
  created_at timestamptz not null default now()
);
create index on public.community_comments (post_id, created_at);

create table public.reports (
  id          uuid primary key default gen_random_uuid(),
  reporter_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  post_id     uuid references public.community_posts(id) on delete cascade,
  comment_id  uuid references public.community_comments(id) on delete cascade,
  reason      text not null check (reason in ('medical_misinformation', 'harassment', 'spam', 'personal_data', 'other')),
  details     text check (char_length(details) <= 500),
  created_at  timestamptz not null default now(),
  constraint reports_one_target check (num_nonnulls(post_id, comment_id) = 1)
);
create unique index reports_unique_post on public.reports (reporter_id, post_id) where post_id is not null;
create unique index reports_unique_comment on public.reports (reporter_id, comment_id) where comment_id is not null;

alter table public.community_profiles enable row level security;
alter table public.community_posts    enable row level security;
alter table public.community_comments enable row level security;
alter table public.reports            enable row level security;

-- Pseudonymes : visibles par les connectés ; chacun gère le sien (patients uniquement)
create policy cprofiles_read on public.community_profiles for select to authenticated using (true);
create policy cprofiles_insert on public.community_profiles for insert to authenticated
  with check (user_id = auth.uid() and public.my_role() = 'patient');
create policy cprofiles_update on public.community_profiles for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy cprofiles_delete on public.community_profiles for delete to authenticated
  using (user_id = auth.uid());

-- Publications
create policy cposts_read on public.community_posts for select to authenticated
  using (not hidden or author_id = auth.uid());
create policy cposts_insert on public.community_posts for insert to authenticated
  with check (author_id = auth.uid() and public.my_role() = 'patient');
create policy cposts_update on public.community_posts for update to authenticated
  using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy cposts_delete on public.community_posts for delete to authenticated
  using (author_id = auth.uid());

-- Commentaires
create policy ccomments_read on public.community_comments for select to authenticated
  using (not hidden or author_id = auth.uid());
create policy ccomments_insert on public.community_comments for insert to authenticated
  with check (author_id = auth.uid() and public.my_role() = 'patient');
create policy ccomments_update on public.community_comments for update to authenticated
  using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy ccomments_delete on public.community_comments for delete to authenticated
  using (author_id = auth.uid());

-- L'auteur ne peut modifier que le texte (pas le masquage, ni l'auteur, ni la date)
revoke update on public.community_posts, public.community_comments from authenticated;
grant update (content) on public.community_posts, public.community_comments to authenticated;
revoke update on public.community_profiles from authenticated;
grant update (pseudonym) on public.community_profiles to authenticated;

-- Signalements : on signale au nom de soi-même, on ne voit que ses propres signalements
create policy reports_read on public.reports for select to authenticated using (reporter_id = auth.uid());
create policy reports_insert on public.reports for insert to authenticated with check (reporter_id = auth.uid());

-- Masquage automatique à 3 signalements distincts
create function public.auto_hide_reported() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.post_id is not null and
     (select count(*) from public.reports where post_id = new.post_id) >= 3 then
    update public.community_posts set hidden = true where id = new.post_id;
  end if;
  if new.comment_id is not null and
     (select count(*) from public.reports where comment_id = new.comment_id) >= 3 then
    update public.community_comments set hidden = true where id = new.comment_id;
  end if;
  return new;
end $$;

create trigger reports_auto_hide after insert on public.reports
  for each row execute function public.auto_hide_reported();
