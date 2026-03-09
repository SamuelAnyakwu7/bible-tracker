-- Run this in Supabase SQL Editor after creating your project.
-- Enable Auth: Dashboard > Authentication > Providers.
-- Enable "Anonymous" sign-in (for no-login UX).

-- Profiles: display name for each user
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Chapter entries: one row per user per chapter (e.g. Genesis|1)
create table if not exists public.chapter_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  chapter_key text not null,
  created_at timestamptz not null default now(),
  unique(user_id, chapter_key)
);

create index if not exists chapter_entries_user_id on public.chapter_entries(user_id);
create index if not exists chapter_entries_created_at on public.chapter_entries(created_at);

-- Create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', nullif(split_part(coalesce(new.email, ''), '@', 1), '')));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS: profiles
alter table public.profiles enable row level security;

-- Anyone can read all profiles (for group view)
create policy "Public read profiles"
  on public.profiles for select
  using (true);

-- Users can update own profile
create policy "Users update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- RLS: chapter_entries
alter table public.chapter_entries enable row level security;

-- Anyone can read all entries (for group view)
create policy "Public read chapter_entries"
  on public.chapter_entries for select
  using (true);

-- Users can insert own entries
create policy "Users insert own entries"
  on public.chapter_entries for insert
  with check (auth.uid() = user_id);

-- Users can delete own entries
create policy "Users delete own entries"
  on public.chapter_entries for delete
  using (auth.uid() = user_id);
