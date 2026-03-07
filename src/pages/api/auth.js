import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { telegram_id, username, first_name, last_name, photo_url, referred_by } = req.body

  if (!telegram_id) return res.status(400).json({ error: 'Missing telegram_id' })

  const { data: existing } = await supabase
    .from('users')
    .select('*')
    .eq('telegram_id', telegram_id)
    .single()

  if (existing) {
    const { data } = await supabase
      .from('users')
      .update({ 
        username: username || existing.username, 
        first_name: first_name || existing.first_name, 
        last_name: last_name || existing.last_name,
      })
      .eq('telegram_id', telegram_id)
      .select()
      .single()
    return res.json({ user: data || existing, is_new: false })
  }

  const referredByInt = referred_by ? parseInt(referred_by) : null
  const { data: newUser, error } = await supabase
    .from('users')
    .insert({
      telegram_id: parseInt(telegram_id),
      username: username || 'user'+telegram_id,
      first_name: first_name || 'User',
      last_name: last_name || '',
      photo_url: photo_url || null,
      referred_by: referredByInt && referredByInt !== parseInt(telegram_id) ? referredByInt : null,
      points: 0,
      referral_count: 0,
      tasks_completed: 0,
    })
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })

  res.json({ user: newUser, is_new: true })
}
