import { useEffect, useState } from 'react'
import { getTelegramUser } from '../lib/telegram'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'
import HomeTab from '../components/HomeTab'
import TasksTab from '../components/TasksTab'
import LeaderboardTab from '../components/LeaderboardTab'
import ReferralTab from '../components/ReferralTab'
import WalletTab from '../components/WalletTab'

export default function Home() {
  const [user, setUser] = useState(null)
  const [dbUser, setDbUser] = useState(null)
  const [activeTab, setActiveTab] = useState('home')
  const [loading, setLoading] = useState(true)
  const [banned, setBanned] = useState(false)

  useEffect(() => { initUser() }, [])

  const getReferralId = () => {
    try {
      const tg = window.Telegram?.WebApp
      const startParam = tg?.initDataUnsafe?.start_param || ''
      if (startParam.startsWith('ref_')) {
        return parseInt(startParam.replace('ref_', ''))
      }
      const fullUrl = window.location.href
      const match = fullUrl.match(/ref_(\d+)/)
      if (match) return parseInt(match[1])
      return null
    } catch (e) {
      return null
    }
  }

  const initUser = async () => {
    try {
      const tg = window.Telegram?.WebApp
      if (tg) { tg.ready(); tg.expand() }

      const tgUser = getTelegramUser()
      const mockUser = tgUser || {
        id: 999999, first_name: 'PeckerUser',
        last_name: '', username: 'peckeruser', photo_url: null
      }
      setUser(mockUser)

      const referredBy = getReferralId()

      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegram_id: mockUser.id,
          username: mockUser.username || '',
          first_name: mockUser.first_name || '',
          last_name: mockUser.last_name || '',
          photo_url: mockUser.photo_url || null,
          referred_by: referredBy,
        })
      })

      const { user: dbUserData } = await res.json()

      if (dbUserData) {
        if (dbUserData.is_banned) {
          setBanned(true)
          setLoading(false)
          return
        }
        setDbUser(dbUserData)
      }
    } catch (err) {
      console.error('Init error:', err)
    }
    setLoading(false)
  }

  const refreshUser = async () => {
    if (!user) return
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_id', user.id)
      .single()
    if (data) setDbUser(data)
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0a0a0f' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '52px', marginBottom: '8px' }}>🐦</div>
          <div style={{ color: '#f5c842', fontFamily: 'Space Mono,monospace', fontSize: '18px' }}>PECKER</div>
          <div style={{ color: '#6b6b8a', fontSize: '13px', marginTop: '8px' }}>Loading...</div>
        </div>
      </div>
    )
  }

  if (banned) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0a0a0f', padding: '20px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '52px', marginBottom: '16px' }}>🚫</div>
          <div style={{ color: '#ff1744', fontFamily: 'Space Mono,monospace', fontSize: '18px', marginBottom: '12px' }}>ACCOUNT BANNED</div>
          <div style={{ color: '#6b6b8a', fontSize: '13px', lineHeight: '1.6' }}>
            Your account has been banned for violating the rules.<br/>
            Contact support if you think this is a mistake.
          </div>
        </div>
      </div>
    )
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} dbUser={dbUser}>
      {activeTab === 'home' && <HomeTab user={user} dbUser={dbUser} refreshUser={refreshUser} />}
      {activeTab === 'tasks' && <TasksTab user={user} dbUser={dbUser} refreshUser={refreshUser} />}
      {activeTab === 'leaderboard' && <LeaderboardTab user={user} dbUser={dbUser} />}
      {activeTab === 'referral' && <ReferralTab user={user} dbUser={dbUser} refreshUser={refreshUser} />}
      {activeTab === 'wallet' && <WalletTab user={user} dbUser={dbUser} refreshUser={refreshUser} />}
    </Layout>
  )
}
