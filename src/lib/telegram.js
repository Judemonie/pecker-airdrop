export const getTelegramUser = () => {
  if (typeof window === 'undefined') return null
  const tg = window.Telegram?.WebApp
  if (!tg) return null
  tg.ready()
  tg.expand()
  return tg.initDataUnsafe?.user || null
}

export const getTelegramWebApp = () => {
  if (typeof window === 'undefined') return null
  return window.Telegram?.WebApp || null
}

export const closeMiniApp = () => {
  window.Telegram?.WebApp?.close()
}

export const hapticFeedback = (type = 'light') => {
  window.Telegram?.WebApp?.HapticFeedback?.impactOccurred(type)
}
