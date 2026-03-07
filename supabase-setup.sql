-- =============================================
-- PECKER AIRDROP - COMPLETE DATABASE SETUP
-- Run this entire file in Supabase SQL Editor
-- =============================================

-- 1. USERS TABLE
create table if not exists users (
  id uuid default gen_random_uuid() primary key,
  telegram_id bigint unique not null,
  username text,
  first_name text,
  last_name text,
  photo_url text,
  points integer default 0,
  referral_count integer default 0,
  tasks_completed integer default 0,
  referred_by bigint references users(telegram_id),
  last_seen timestamptz default now(),
  created_at timestamptz default now()
);

-- 2. TASKS TABLE
create table if not exists tasks (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  task_type text not null check (task_type in ('telegram', 'twitter', 'website', 'daily', 'custom')),
  url text,
  icon text,
  points integer not null default 100,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- 3. USER_TASKS TABLE (tracks completions)
create table if not exists user_tasks (
  id uuid default gen_random_uuid() primary key,
  telegram_id bigint references users(telegram_id) on delete cascade,
  task_id uuid references tasks(id) on delete cascade,
  completed_at timestamptz default now(),
  unique(telegram_id, task_id)
);

-- 4. INDEXES for performance
create index if not exists idx_users_telegram_id on users(telegram_id);
create index if not exists idx_users_points on users(points desc);
create index if not exists idx_user_tasks_telegram on user_tasks(telegram_id);
create index if not exists idx_user_tasks_task on user_tasks(task_id);

-- 5. ROW LEVEL SECURITY
alter table users enable row level security;
alter table tasks enable row level security;
alter table user_tasks enable row level security;

-- Allow all reads (public leaderboard)
create policy "Public read users" on users for select using (true);
create policy "Public read tasks" on tasks for select using (true);
create policy "Public read user_tasks" on user_tasks for select using (true);

-- Allow inserts/updates from client
create policy "Insert users" on users for insert with check (true);
create policy "Update users" on users for update using (true);
create policy "Insert user_tasks" on user_tasks for insert with check (true);
create policy "Update user_tasks" on user_tasks for update using (true);

-- 6. FUNCTION: Add points to user
create or replace function add_points(user_telegram_id bigint, points_to_add integer)
returns void language plpgsql as $$
begin
  update users
  set points = points + points_to_add,
      tasks_completed = tasks_completed + 1
  where telegram_id = user_telegram_id;
end;
$$;

-- 7. FUNCTION: Give referral bonus
create or replace function give_referral_bonus(referrer_id bigint, new_user_id bigint)
returns void language plpgsql as $$
begin
  update users
  set points = points + 500,
      referral_count = referral_count + 1
  where telegram_id = referrer_id;
end;
$$;

-- 8. SEED DEFAULT TASKS
insert into tasks (title, description, task_type, url, icon, points) values
  -- Daily
  ('Daily Check-In', 'Check in every day to earn bonus points', 'daily', null, '⚡', 50),
  
  -- Telegram
  ('Join PECKER Channel', 'Join our official Telegram channel for updates', 'telegram', 'https://t.me/PECKER_BSC', '📢', 300),
  ('Join PECKER Group', 'Join our community discussion group', 'telegram', 'https://t.me/PECKER_BSC', '💬', 200),
  
  -- Twitter/X
  ('Follow PECKER on X', 'Follow our official Twitter/X account', 'twitter', 'https://twitter.com/PECKER_BSC', '🐦', 300),
  ('Like & Retweet Pinned Post', 'Like and retweet our pinned announcement', 'twitter', 'https://twitter.com/PECKER_BSC', '🔁', 200),
  
  -- Website
  ('Visit PECKER Website', 'Visit our official website to learn more', 'website', 'https://t.me/PECKER_BSC', '🌐', 150),
  
  -- Custom
  ('Share Your BSC Address', 'Share to be included in the snapshot', 'custom', null, '💎', 500),
  ('Invite 3 Friends', 'Invite 3 friends using your referral link', 'custom', null, '👥', 300)
on conflict do nothing;

-- Done! Your database is ready 🎉
