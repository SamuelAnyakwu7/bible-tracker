-- Run this in Supabase SQL Editor after creating your project.
-- Enable Auth (Email/Password) in Supabase Dashboard > Authentication > Providers.
-- To skip confirm-email: Authentication > Providers > Email > turn OFF "Confirm email".

-- Profiles: link auth.users to role and display name
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'youth' check (role in ('youth', 'leader')),
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Reading entries: one row per user per plan day (30-day plan)
create table if not exists public.reading_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan_day int not null check (plan_day >= 1 and plan_day <= 30),
  created_at timestamptz not null default now(),
  unique(user_id, plan_day)
);

create index if not exists reading_entries_user_id on public.reading_entries(user_id);
create index if not exists reading_entries_created_at on public.reading_entries(created_at);

-- Create profile on signup (run once)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, role, display_name)
  values (new.id, 'youth', coalesce(new.raw_user_meta_data->>'display_name', new.email));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS: profiles
alter table public.profiles enable row level security;

-- Youth: read/update own profile
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Leaders: read all profiles
create policy "Leaders can read all profiles"
  on public.profiles for select
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'leader')
  );

-- RLS: reading_entries
alter table public.reading_entries enable row level security;

-- Youth: full access to own entries only
create policy "Users can read own entries"
  on public.reading_entries for select
  using (auth.uid() = user_id);

create policy "Users can insert own entries"
  on public.reading_entries for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own entries"
  on public.reading_entries for delete
  using (auth.uid() = user_id);

-- Leaders: read all entries (no write)
create policy "Leaders can read all entries"
  on public.reading_entries for select
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'leader')
  );

-- Optional: allow first user to become leader (run manually or via dashboard)
-- update public.profiles set role = 'leader' where id = 'your-user-uuid';
