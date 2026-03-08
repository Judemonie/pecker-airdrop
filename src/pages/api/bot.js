const BOT_TOKEN = process.env.BOT_TOKEN

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { message } = req.body
  if (!message) return res.status(200).end()

  const chatId = message.chat.id
  const text = message.text || ''

  if (text.startsWith('/start')) {
    const startParam = text.split(' ')[1] || ''
    const appUrl = startParam
      ? `https://pecker-airdrop.vercel.app/?startapp=${startParam}`
      : `https://pecker-airdrop.vercel.app/`

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
            {
              text: '🐦 Open PECKER Airdrop',
              web_app: { url: appUrl }
            }
          ]]
        }
      })
    })
  }

  res.status(200).json({ ok: true })
}
