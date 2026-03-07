-- =============================================
-- PECKER AIRDROP - BUG FIXES
-- Run this in Supabase SQL Editor
-- =============================================

-- Fix the give_referral_bonus function
create or replace function give_referral_bonus(referrer_id bigint, new_user_id bigint)
returns void language plpgsql as $$
begin
  -- Add 500 points and increment referral count for referrer
  update users 
  set 
    points = points + 500,
    referral_count = referral_count + 1
  where telegram_id = referrer_id;
end;
$$;

-- Fix add_points function (don't increment tasks_completed for referral bonuses)
create or replace function add_points(user_telegram_id bigint, points_to_add integer)
returns void language plpgsql as $$
begin
  update users
  set 
    points = points + points_to_add,
    tasks_completed = tasks_completed + 1
  where telegram_id = user_telegram_id;
end;
$$;

-- Add admin password env support
-- (set NEXT_PUBLIC_ADMIN_PASSWORD in Vercel environment variables)

-- Done! ✅
