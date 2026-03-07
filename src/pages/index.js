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

  useEffect(() => { initUser() }, [])

  const initUser = async () => {
    const tgUser = getTelegramUser()
    const mockUser = tgUser || { id: 999999, first_name: 'PeckerUser', last_name: '', username: 'peckeruser', photo_url: null }
    setUser(mockUser)

    const startParam = window.Telegram?.WebApp?.initDataUnsafe?.start_param
    const referredBy = startParam?.startsWith('ref_') ? parseInt(startParam.replace('ref_', '')) : null

    // Check if user already exists
    const { data: existing } = await supabase
      .from('users').select('*').eq('telegram_id', mockUser.id).single()

    if (existing) {
      // User exists - just update last seen
      const { data } = await supabase
        .from('users')
        .update({ username: mockUser.username, first_name: mockUser.first_name, last_name: mockUser.last_name })
        .eq('telegram_id', mockUser.id)
        .select().single()
      setDbUser(data || existing)
    } else {
      // New user - insert and give referral bonus
      const { data: newUser } = await supabase
        .from('users')
        .insert({
          telegram_id: mockUser.id,
          username: mockUser.username || `user${mockUser.id}`,
          first_name: mockUser.first_name || 'User',
          last_name: mockUser.last_name || '',
          photo_url: mockUser.photo_url || null,
          referred_by: referredBy,
          points: 0,
          referral_count: 0,
          tasks_completed: 0,
        })
        .select().single()

      if (newUser) {
        setDbUser(newUser)
        // Give referral bonus to referrer
        if (referredBy && referredBy !== mockUser.id) {
          await supabase
            .from('users')
            .update({
              points: supabase.raw ? undefined : undefined, // handled by RPC
              referral_count: supabase.raw ? undefined : undefined,
            })
          // Use the fix referral function
          await supabase.rpc('give_referral_bonus', {
            referrer_id: referredBy,
            new_user_id: mockUser.id,
          })
        }
      }
    }
    setLoading(false)
  }

  const refreshUser = async () => {
    if (!user) return
    const { data } = await supabase.from('users').select('*').eq('telegram_id', user.id).single()
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
