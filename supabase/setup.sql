-- Fresh Supabase setup for this template.
-- Run once in the SQL Editor of a new project.
-- It creates tables, row level security, the open-call view counter,
-- message realtime, storage buckets, and storage policies.
-- It does not insert sample members, artwork, or groups.

-- ---------------------------------------------------------------------------
-- Artwork
-- ---------------------------------------------------------------------------

create table if not exists public.artwork (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  image_url text not null,
  title text,
  description text,
  medium text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_artwork_created_at on public.artwork (created_at desc);
create index if not exists idx_artwork_user_id on public.artwork (user_id);

alter table public.artwork enable row level security;

drop policy if exists "Anyone can read artwork" on public.artwork;
drop policy if exists "Authenticated users can create artwork" on public.artwork;
drop policy if exists "Users can update their own artwork" on public.artwork;
drop policy if exists "Users can delete their own artwork" on public.artwork;

create policy "Anyone can read artwork"
  on public.artwork for select
  using (true);

create policy "Authenticated users can create artwork"
  on public.artwork for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own artwork"
  on public.artwork for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own artwork"
  on public.artwork for delete
  to authenticated
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Artwork likes
-- ---------------------------------------------------------------------------

create table if not exists public.artwork_likes (
  id uuid primary key default gen_random_uuid(),
  artwork_id uuid not null references public.artwork(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  unique (artwork_id, user_id)
);

create index if not exists idx_artwork_likes_artwork_id on public.artwork_likes (artwork_id);
create index if not exists idx_artwork_likes_user_id on public.artwork_likes (user_id);

alter table public.artwork_likes enable row level security;

drop policy if exists "Anyone can read artwork likes" on public.artwork_likes;
drop policy if exists "Authenticated users can like artwork" on public.artwork_likes;
drop policy if exists "Users can unlike artwork" on public.artwork_likes;

create policy "Anyone can read artwork likes"
  on public.artwork_likes for select
  using (true);

create policy "Authenticated users can like artwork"
  on public.artwork_likes for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can unlike artwork"
  on public.artwork_likes for delete
  to authenticated
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Articles and tutorials
-- ---------------------------------------------------------------------------

create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  excerpt text not null,
  category text not null,
  content text not null,
  author text not null,
  read_time text default '5 min read'
);

create index if not exists idx_articles_user_id on public.articles (user_id);
create index if not exists idx_articles_created_at on public.articles (created_at desc);
create index if not exists idx_articles_category on public.articles (category);

alter table public.articles enable row level security;

drop policy if exists "Anyone can read articles" on public.articles;
drop policy if exists "Authenticated users can create articles" on public.articles;
drop policy if exists "Users can update their own articles" on public.articles;
drop policy if exists "Users can delete their own articles" on public.articles;

create policy "Anyone can read articles"
  on public.articles for select
  using (true);

create policy "Authenticated users can create articles"
  on public.articles for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own articles"
  on public.articles for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own articles"
  on public.articles for delete
  to authenticated
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Groups
-- ---------------------------------------------------------------------------

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  name text not null,
  description text,
  member_count integer default 0,
  is_active boolean default true,
  creator_id uuid references auth.users(id) on delete set null
);

create index if not exists idx_groups_is_active on public.groups (is_active);
create index if not exists idx_groups_created_at on public.groups (created_at desc);
create index if not exists idx_groups_creator_id on public.groups (creator_id);

create table if not exists public.group_members (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  unique (group_id, user_id)
);

create index if not exists idx_group_members_group_id on public.group_members (group_id);
create index if not exists idx_group_members_user_id on public.group_members (user_id);

alter table public.groups enable row level security;
alter table public.group_members enable row level security;

drop policy if exists "Anyone can view active groups" on public.groups;
drop policy if exists "Authenticated users can create groups" on public.groups;
drop policy if exists "Pro users can create groups" on public.groups;
drop policy if exists "Creators can update their groups" on public.groups;
drop policy if exists "Creators can delete their groups" on public.groups;
drop policy if exists "Anyone can view group members" on public.group_members;
drop policy if exists "Authenticated users can join groups" on public.group_members;
drop policy if exists "Users can leave groups" on public.group_members;

create policy "Anyone can view active groups"
  on public.groups for select
  using (is_active = true);

create policy "Authenticated users can create groups"
  on public.groups for insert
  to authenticated
  with check (auth.uid() = creator_id);

create policy "Creators can update their groups"
  on public.groups for update
  to authenticated
  using (auth.uid() = creator_id)
  with check (auth.uid() = creator_id);

create policy "Creators can delete their groups"
  on public.groups for delete
  to authenticated
  using (auth.uid() = creator_id);

create policy "Anyone can view group members"
  on public.group_members for select
  using (true);

create policy "Authenticated users can join groups"
  on public.group_members for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can leave groups"
  on public.group_members for delete
  to authenticated
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Community posts
-- ---------------------------------------------------------------------------

create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content text,
  created_at timestamptz default now(),
  user_name text,
  user_handle text,
  user_avatar text,
  image_url text,
  group_id uuid references public.groups(id) on delete cascade
);

create index if not exists idx_community_posts_created_at on public.community_posts (created_at desc);
create index if not exists idx_community_posts_user_id on public.community_posts (user_id);
create index if not exists idx_community_posts_group_id on public.community_posts (group_id);

alter table public.community_posts enable row level security;

drop policy if exists "Anyone can read posts" on public.community_posts;
drop policy if exists "Authenticated users can create posts" on public.community_posts;
drop policy if exists "Users can update their own posts" on public.community_posts;
drop policy if exists "Users can delete their own posts" on public.community_posts;

create policy "Anyone can read posts"
  on public.community_posts for select
  using (true);

create policy "Authenticated users can create posts"
  on public.community_posts for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own posts"
  on public.community_posts for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own posts"
  on public.community_posts for delete
  to authenticated
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Commissions
-- ---------------------------------------------------------------------------

create table if not exists public.commission_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text not null,
  category text not null,
  type text not null,
  budget_min decimal(10, 2) not null,
  budget_max decimal(10, 2) not null,
  location text,
  is_remote boolean default false,
  deadline date,
  contact_email text,
  contact_phone text,
  client_name text,
  created_at timestamptz default now()
);

create index if not exists idx_commission_posts_created_at on public.commission_posts (created_at desc);
create index if not exists idx_commission_posts_user_id on public.commission_posts (user_id);
create index if not exists idx_commission_posts_category on public.commission_posts (category);
create index if not exists idx_commission_posts_type on public.commission_posts (type);
create index if not exists idx_commission_posts_is_remote on public.commission_posts (is_remote);

alter table public.commission_posts enable row level security;

drop policy if exists "Anyone can read commission posts" on public.commission_posts;
drop policy if exists "Authenticated users can create commission posts" on public.commission_posts;
drop policy if exists "Users can update their own commission posts" on public.commission_posts;
drop policy if exists "Users can delete their own commission posts" on public.commission_posts;

create policy "Anyone can read commission posts"
  on public.commission_posts for select
  using (true);

create policy "Authenticated users can create commission posts"
  on public.commission_posts for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own commission posts"
  on public.commission_posts for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own commission posts"
  on public.commission_posts for delete
  to authenticated
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Open calls
-- ---------------------------------------------------------------------------

create table if not exists public.open_calls (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text not null,
  category text not null,
  type text not null,
  city text,
  state text,
  country text,
  is_remote boolean default false,
  deadline date not null,
  prizes text,
  application_fee decimal(10, 2) default 0,
  fee_currency text default 'USD',
  view_count integer default 0,
  contact_email text not null,
  gallery_name text,
  website text not null,
  header_image text,
  organizer_name text,
  created_at timestamptz default now()
);

create index if not exists idx_open_calls_created_at on public.open_calls (created_at desc);
create index if not exists idx_open_calls_user_id on public.open_calls (user_id);
create index if not exists idx_open_calls_category on public.open_calls (category);
create index if not exists idx_open_calls_type on public.open_calls (type);
create index if not exists idx_open_calls_is_remote on public.open_calls (is_remote);
create index if not exists idx_open_calls_deadline on public.open_calls (deadline);
create index if not exists idx_open_calls_country on public.open_calls (country);
create index if not exists idx_open_calls_city on public.open_calls (city);

alter table public.open_calls enable row level security;

drop policy if exists "Anyone can read open calls" on public.open_calls;
drop policy if exists "Authenticated users can create open calls" on public.open_calls;
drop policy if exists "Users can update their own open calls" on public.open_calls;
drop policy if exists "Users can delete their own open calls" on public.open_calls;

create policy "Anyone can read open calls"
  on public.open_calls for select
  using (true);

create policy "Authenticated users can create open calls"
  on public.open_calls for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own open calls"
  on public.open_calls for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own open calls"
  on public.open_calls for delete
  to authenticated
  using (auth.uid() = user_id);

create or replace function public.increment_open_call_views(call_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count integer;
begin
  update public.open_calls
  set view_count = coalesce(view_count, 0) + 1
  where id = call_id
  returning view_count into new_count;

  return coalesce(new_count, 0);
end;
$$;

grant execute on function public.increment_open_call_views(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Meetups and exhibitions
-- ---------------------------------------------------------------------------

create table if not exists public.meetups (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  title text not null,
  description text not null,
  event_time timestamptz not null,
  location text not null,
  host_id uuid not null,
  host_name text not null,
  attendee_count integer default 0,
  banner_image_url text
);

create index if not exists idx_meetups_event_time on public.meetups (event_time);
create index if not exists idx_meetups_host_id on public.meetups (host_id);
create index if not exists idx_meetups_created_at on public.meetups (created_at desc);

create table if not exists public.exhibitions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  title text not null,
  description text not null,
  start_date timestamptz not null,
  end_date timestamptz,
  location text not null,
  host_id uuid not null,
  host_name text not null,
  visitor_count integer default 0,
  banner_image_url text
);

create index if not exists idx_exhibitions_start_date on public.exhibitions (start_date);
create index if not exists idx_exhibitions_end_date on public.exhibitions (end_date);
create index if not exists idx_exhibitions_host_id on public.exhibitions (host_id);
create index if not exists idx_exhibitions_created_at on public.exhibitions (created_at desc);

alter table public.meetups enable row level security;
alter table public.exhibitions enable row level security;

drop policy if exists "Anyone can view meetups" on public.meetups;
drop policy if exists "Authenticated users can create meetups" on public.meetups;
drop policy if exists "Hosts can update their own meetups" on public.meetups;
drop policy if exists "Hosts can delete their own meetups" on public.meetups;
drop policy if exists "Anyone can view exhibitions" on public.exhibitions;
drop policy if exists "Authenticated users can create exhibitions" on public.exhibitions;
drop policy if exists "Hosts can update their own exhibitions" on public.exhibitions;
drop policy if exists "Hosts can delete their own exhibitions" on public.exhibitions;

create policy "Anyone can view meetups"
  on public.meetups for select
  using (true);

create policy "Authenticated users can create meetups"
  on public.meetups for insert
  to authenticated
  with check (auth.uid() = host_id);

create policy "Hosts can update their own meetups"
  on public.meetups for update
  to authenticated
  using (auth.uid() = host_id)
  with check (auth.uid() = host_id);

create policy "Hosts can delete their own meetups"
  on public.meetups for delete
  to authenticated
  using (auth.uid() = host_id);

create policy "Anyone can view exhibitions"
  on public.exhibitions for select
  using (true);

create policy "Authenticated users can create exhibitions"
  on public.exhibitions for insert
  to authenticated
  with check (auth.uid() = host_id);

create policy "Hosts can update their own exhibitions"
  on public.exhibitions for update
  to authenticated
  using (auth.uid() = host_id)
  with check (auth.uid() = host_id);

create policy "Hosts can delete their own exhibitions"
  on public.exhibitions for delete
  to authenticated
  using (auth.uid() = host_id);

-- ---------------------------------------------------------------------------
-- Messages
-- ---------------------------------------------------------------------------

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  user1_id uuid not null references auth.users(id) on delete cascade,
  user2_id uuid not null references auth.users(id) on delete cascade,
  unique (user1_id, user2_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  is_read boolean default false,
  read_at timestamptz
);

create index if not exists idx_conversations_user1_id on public.conversations (user1_id);
create index if not exists idx_conversations_user2_id on public.conversations (user2_id);
create index if not exists idx_conversations_updated_at on public.conversations (updated_at desc);
create index if not exists idx_messages_conversation_id on public.messages (conversation_id);
create index if not exists idx_messages_sender_id on public.messages (sender_id);
create index if not exists idx_messages_created_at on public.messages (created_at desc);
create index if not exists idx_messages_is_read on public.messages (is_read);

alter table public.conversations enable row level security;
alter table public.messages enable row level security;

drop policy if exists "Users can view their own conversations" on public.conversations;
drop policy if exists "Users can create conversations" on public.conversations;
drop policy if exists "Users can update their own conversations" on public.conversations;
drop policy if exists "Users can view messages in their conversations" on public.messages;
drop policy if exists "Users can create messages in their conversations" on public.messages;
drop policy if exists "Users can update messages they received" on public.messages;

create policy "Users can view their own conversations"
  on public.conversations for select
  to authenticated
  using (auth.uid() = user1_id or auth.uid() = user2_id);

create policy "Users can create conversations"
  on public.conversations for insert
  to authenticated
  with check (auth.uid() = user1_id or auth.uid() = user2_id);

create policy "Users can update their own conversations"
  on public.conversations for update
  to authenticated
  using (auth.uid() = user1_id or auth.uid() = user2_id)
  with check (auth.uid() = user1_id or auth.uid() = user2_id);

create policy "Users can view messages in their conversations"
  on public.messages for select
  to authenticated
  using (
    exists (
      select 1 from public.conversations
      where conversations.id = messages.conversation_id
        and (conversations.user1_id = auth.uid() or conversations.user2_id = auth.uid())
    )
  );

create policy "Users can create messages in their conversations"
  on public.messages for insert
  to authenticated
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.conversations
      where conversations.id = messages.conversation_id
        and (conversations.user1_id = auth.uid() or conversations.user2_id = auth.uid())
    )
  );

create policy "Users can update messages they received"
  on public.messages for update
  to authenticated
  using (
    exists (
      select 1 from public.conversations
      where conversations.id = messages.conversation_id
        and (
          (conversations.user1_id = auth.uid() and messages.sender_id = conversations.user2_id)
          or (conversations.user2_id = auth.uid() and messages.sender_id = conversations.user1_id)
        )
    )
  );

create or replace function public.update_conversation_timestamp()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversations
  set updated_at = now()
  where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists update_conversation_on_message on public.messages;
create trigger update_conversation_on_message
  after insert on public.messages
  for each row
  execute function public.update_conversation_timestamp();

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Storage
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values
  ('artwork', 'artwork', true),
  ('profile-images', 'profile-images', true),
  ('event-images', 'event-images', true)
on conflict (id) do update set public = true;

drop policy if exists "Authenticated users can upload artwork" on storage.objects;
drop policy if exists "Anyone can view artwork" on storage.objects;
drop policy if exists "Users can delete their own artwork" on storage.objects;
drop policy if exists "Authenticated users can upload profile images" on storage.objects;
drop policy if exists "Anyone can view profile images" on storage.objects;
drop policy if exists "Authenticated users can upload post images" on storage.objects;
drop policy if exists "Authenticated users can upload open call images" on storage.objects;
drop policy if exists "Authenticated users can upload tutorial images" on storage.objects;
drop policy if exists "Authenticated users can upload meetup images" on storage.objects;
drop policy if exists "Authenticated users can upload exhibition images" on storage.objects;
drop policy if exists "Anyone can view event images" on storage.objects;
drop policy if exists "Users can delete their own post images" on storage.objects;
drop policy if exists "Users can delete their own open call images" on storage.objects;
drop policy if exists "Users can delete their own tutorial images" on storage.objects;
drop policy if exists "Users can delete their own meetup images" on storage.objects;
drop policy if exists "Users can delete their own exhibition images" on storage.objects;

create policy "Authenticated users can upload artwork"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'artwork'
    and (storage.foldername(name))[1] = 'artwork'
  );

create policy "Anyone can view artwork"
  on storage.objects for select
  to public
  using (bucket_id = 'artwork');

create policy "Users can delete their own artwork"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'artwork'
    and (storage.foldername(name))[1] = 'artwork'
    and name like ('artwork/' || auth.uid()::text || '-%')
  );

create policy "Authenticated users can upload profile images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'profile-images'
    and (storage.foldername(name))[1] = 'avatars'
  );

create policy "Anyone can view profile images"
  on storage.objects for select
  to public
  using (bucket_id = 'profile-images');

create policy "Authenticated users can upload post images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'event-images'
    and (storage.foldername(name))[1] = 'posts'
  );

create policy "Authenticated users can upload open call images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'event-images'
    and (storage.foldername(name))[1] = 'open-calls'
  );

create policy "Authenticated users can upload tutorial images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'event-images'
    and (storage.foldername(name))[1] = 'tutorials'
  );

create policy "Authenticated users can upload meetup images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'event-images'
    and (storage.foldername(name))[1] = 'meetups'
  );

create policy "Authenticated users can upload exhibition images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'event-images'
    and (storage.foldername(name))[1] = 'exhibitions'
  );

create policy "Anyone can view event images"
  on storage.objects for select
  to public
  using (bucket_id = 'event-images');

create policy "Users can delete their own post images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'event-images'
    and (storage.foldername(name))[1] = 'posts'
    and name like ('posts/' || auth.uid()::text || '-%')
  );

create policy "Users can delete their own open call images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'event-images'
    and (storage.foldername(name))[1] = 'open-calls'
    and name like ('open-calls/' || auth.uid()::text || '-%')
  );

create policy "Users can delete their own tutorial images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'event-images'
    and (storage.foldername(name))[1] = 'tutorials'
    and name like ('tutorials/' || auth.uid()::text || '-%')
  );

create policy "Users can delete their own meetup images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'event-images'
    and (storage.foldername(name))[1] = 'meetups'
    and name like ('meetups/' || auth.uid()::text || '-%')
  );

create policy "Users can delete their own exhibition images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'event-images'
    and (storage.foldername(name))[1] = 'exhibitions'
    and name like ('exhibitions/' || auth.uid()::text || '-%')
  );
