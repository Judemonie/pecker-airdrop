import '../styles/globals.css'
import { useEffect, useState } from 'react'
import { getTelegramWebApp } from '../lib/telegram'

export default function App({ Component, pageProps }) {
  const [tgReady, setTgReady] = useState(false)

  useEffect(() => {
    const tg = getTelegramWebApp()
    if (tg) {
      tg.ready()
      tg.expand()
      tg.setHeaderColor('#0a0a0f')
      tg.setBackgroundColor('#0a0a0f')
    }
    setTgReady(true)
  }, [])

  if (!tgReady) return null

  return <Component {...pageProps} />
}
