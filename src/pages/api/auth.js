import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { telegram_id, username, first_name, last_name, photo_url, referred_by } = req.body
  if (!telegram_id) return res.status(400).json({ error: 'Missing telegram_id' })

  const tidInt = parseInt(telegram_id)

  const { data: existing } = await supabase
    .from('users')
    .select('*')
    .eq('telegram_id', tidInt)
    .single()

  if (existing) {
    const { data: pending } = await supabase
      .from('pending_referrals')
      .select('referred_by')
      .eq('telegram_id', tidInt)
      .single()

    if (pending && !existing.referred_by) {
      const { data: referrer } = await supabase
        .from('users').select('*')
        .eq('telegram_id', pending.referred_by).single()

      if (referrer) {
        await supabase.from('users')
          .update({ referred_by: pending.referred_by, points: existing.points + 500 })
          .eq('telegram_id', tidInt)

        await supabase.from('users')
          .update({
            points: referrer.points + 500,
            referral_count: referrer.referral_count + 1
          })
          .eq('telegram_id', pending.referred_by)
      }
      await supabase.from('pending_referrals').delete().eq('telegram_id', tidInt)
    }

    const { data } = await supabase
      .from('users')
      .update({
        username: username || existing.username,
        first_name: first_name || existing.first_name,
        last_name: last_name || existing.last_name,
      })
      .eq('telegram_id', tidInt)
      .select()
      .single()
    return res.json({ user: data || existing, is_new: false })
  }

  // Brand new user
  let finalReferredBy = null

  const { data: pending } = await supabase
    .from('pending_referrals')
    .select('referred_by')
    .eq('telegram_id', tidInt)
    .single()

  if (pending) {
    finalReferredBy = pending.referred_by
    await supabase.from('pending_referrals').delete().eq('telegram_id', tidInt)
  } else if (referred_by && parseInt(referred_by) !== tidInt) {
    finalReferredBy = parseInt(referred_by)
  }

  const { data: newUser, error } = await supabase
    .from('users')
    .insert({
      telegram_id: tidInt,
      username: username || 'user' + tidInt,
      first_name: first_name || 'User',
      last_name: last_name || '',
      photo_url: photo_url || null,
      referred_by: finalReferredBy,
      points: 500,
      referral_count: 0,
      tasks_completed: 0,
    })
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })

  if (finalReferredBy) {
    const { data: referrer } = await supabase
      .from('users').select('*')
      .eq('telegram_id', finalReferredBy).single()

    if (referrer) {
      await supabase.from('users')
        .update({
          points: referrer.points + 500,
          referral_count: referrer.referral_count + 1
        })
        .eq('telegram_id', finalReferredBy)
    }
  }

  const { data: finalUser } = await supabase
    .from('users').select('*')
    .eq('telegram_id', tidInt).single()

  res.json({ user: finalUser || newUser, is_new: true })
}
