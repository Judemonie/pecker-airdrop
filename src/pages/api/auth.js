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

  // Check if user already exists
  const { data: existing } = await supabase
    .from('users')
    .select('*')
    .eq('telegram_id', tidInt)
    .single()

  if (existing) {
    // Just update profile, do NOT touch points or referral
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

  // New user — parse referrer
  const referredByInt = referred_by && parseInt(referred_by) !== tidInt
    ? parseInt(referred_by)
    : null

  // Insert new user (trigger will fire automatically for referral bonus)
  const { data: newUser, error } = await supabase
    .from('users')
    .insert({
      telegram_id: tidInt,
      username: username || 'user' + tidInt,
      first_name: first_name || 'User',
      last_name: last_name || '',
      photo_url: photo_url || null,
      referred_by: referredByInt,
      points: 0,
      referral_count: 0,
      tasks_completed: 0,
    })
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })

  // Wait briefly for trigger to run, then fetch updated user with bonus points
  await new Promise(r => setTimeout(r, 500))
  const { data: updatedUser } = await supabase
    .from('users')
    .select('*')
    .eq('telegram_id', tidInt)
    .single()

  res.json({ user: updatedUser || newUser, is_new: true })
}
