import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const BOT_TOKEN = process.env.BOT_TOKEN

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { message } = req.body
  if (!message) return res.status(200).end()

  const chatId = message.chat.id
  const userId = message.from?.id
  const text = message.text || ''

  if (text.startsWith('/start')) {
    const startParam = text.split(' ')[1] || ''
    const referredBy = startParam.startsWith('ref_')
      ? parseInt(startParam.replace('ref_', ''))
      : null

    if (referredBy && userId && referredBy !== userId) {
      // Check if user already exists with no referral
      const { data: existingUser } = await supabase
        .from('users')
        .select('referred_by')
        .eq('telegram_id', userId)
        .single()

      if (existingUser && !existingUser.referred_by) {
        // User exists but has no referral — credit them now
        const { data: referrer } = await supabase
          .from('users').select('*')
          .eq('telegram_id', referredBy).single()

        if (referrer) {
          await supabase.from('users')
            .update({ referred_by: referredBy, points: supabase.rpc('increment', { row_id: userId, amount: 500 }) })
            .eq('telegram_id', userId)

          await supabase.from('users')
            .update({
              points: referrer.points + 500,
              referral_count: referrer.referral_count + 1
            })
            .eq('telegram_id', referredBy)
        }
      } else {
        // Save pending referral for new users
        await supabase
          .from('pending_referrals')
          .upsert({ telegram_id: userId, referred_by: referredBy })
      }
    }

    const appUrl = `https://pecker-airdrop.vercel.app/`

    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        photo: 'https://pecker-airdrop.vercel.app/IMG_6576.jpeg',
        caption: `🐦 *Welcome to PECKER Airdrop!*\n\nEarn $PECKER tokens by:\n✅ Completing tasks\n👥 Inviting friends\n🏆 Climbing the leaderboard\n\n🚀 Tap the button below to start earning!`,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[
            { text: '🐦 Open PECKER Airdrop', web_app: { url: appUrl } }
          ]]
        }
      })
    })
  }

  res.status(200).json({ ok: true })
}
