-- ============================================================
-- WHENTOR AI — Supabase Schema
-- Run this in your Supabase project: SQL Editor → New query
-- ============================================================

-- PROFILES
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  tier text not null default 'free' check (tier in ('free', 'pro', 'elite')),
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  stripe_price_id text,
  subscription_status text default 'inactive',
  daily_wisdom_enabled boolean default true,
  onboarded boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- CHAT SESSIONS (one per user per world)
create table if not exists public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  world_id text not null,
  messages jsonb not null default '[]',
  message_count int not null default 0,
  last_topic text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, world_id)
);

-- USAGE LOGS (for free tier rate limiting)
create table if not exists public.usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  date date not null default current_date,
  message_count int not null default 0,
  unique(user_id, date)
);

-- WISDOM SENDS (track daily wisdom delivery)
create table if not exists public.wisdom_sends (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  world_id text not null,
  sent_at timestamptz default now(),
  wisdom_text text
);

-- ── RLS ──────────────────────────────────────────────────────

alter table public.profiles enable row level security;
alter table public.chat_sessions enable row level security;
alter table public.usage_logs enable row level security;
alter table public.wisdom_sends enable row level security;

-- Profiles: users can read/update their own
create policy "profiles_self" on public.profiles
  for all using (auth.uid() = id);

-- Chat sessions: users own their sessions
create policy "sessions_self" on public.chat_sessions
  for all using (auth.uid() = user_id);

-- Usage logs: users can see their own
create policy "usage_self" on public.usage_logs
  for all using (auth.uid() = user_id);

-- Wisdom sends: users can see their own
create policy "wisdom_self" on public.wisdom_sends
  for select using (auth.uid() = user_id);

-- ── TRIGGERS ─────────────────────────────────────────────────

-- Auto-create profile on sign up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger sessions_updated_at before update on public.chat_sessions
  for each row execute function public.set_updated_at();
