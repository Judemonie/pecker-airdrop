import { supabase } from '../../lib/supabase'

export default async function handler(req, res) {
  try {
    await supabase.from('users').select('count').limit(1)
    res.json({ status: 'alive', time: new Date().toISOString() })
  } catch (e) {
    res.status(500).json({ status: 'error' })
  }
}
