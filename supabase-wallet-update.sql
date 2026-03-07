-- =============================================
-- PECKER AIRDROP - WALLET UPDATE
-- Run this in Supabase SQL Editor
-- (only if you already ran supabase-setup.sql)
-- =============================================

-- Add wallet columns to users table
alter table users
  add column if not exists wallet_address text,
  add column if not exists wallet_submitted_at timestamptz;

-- Index for wallet lookups
create index if not exists idx_users_wallet on users(wallet_address);

-- Allow updates to wallet fields
drop policy if exists "Update users" on users;
create policy "Update users" on users for update using (true);

-- =============================================
-- ADMIN: Export all wallets for airdrop
-- Run this query to get the snapshot CSV
-- =============================================
-- SELECT
--   telegram_id,
--   username,
--   first_name,
--   wallet_address,
--   points,
--   referral_count,
--   tasks_completed,
--   wallet_submitted_at
-- FROM users
-- WHERE wallet_address IS NOT NULL
-- ORDER BY points DESC;

-- =============================================
-- Done! Wallet feature is now active ✅
-- =============================================
