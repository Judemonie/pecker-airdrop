import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { telegram_id, username, first_name, last_name, photo_url, referred_by } = req.body

  if (!telegram_id) return res.status(400).json({ error: 'Missing telegram_id' })

  // Check if user exists
  const { data: existing } = await supabase
    .from('users')
    .select('*')
    .eq('telegram_id', telegram_id)
    .single()

  if (existing) {
    // Update last seen
    const { data } = await supabase
      .from('users')
      .update({ username, first_name, last_name, photo_url, last_seen: new Date().toISOString() })
      .eq('telegram_id', telegram_id)
      .select().single()
    return res.json({ user: data, is_new: false })
  }

  // New user
  const { data, error } = await supabase
    .from('users')
    .insert({
      telegram_id,
      username,
      first_name,
      last_name,
      photo_url,
      referred_by: referred_by || null,
      points: 0,
      referral_count: 0,
      tasks_completed: 0,
    })
    .select().single()

  if (error) return res.status(500).json({ error: error.message })

  // Give referral bonus
  if (referred_by) {
    await supabase.rpc('add_points', {
      user_telegram_id: referred_by,
      points_to_add: 500,
    })
    await supabase
      .from('users')
      .update({ referral_count: supabase.raw('referral_count + 1') })
      .eq('telegram_id', referred_by)
  }

  res.json({ user: data, is_new: true })
}
