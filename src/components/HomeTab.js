import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Zap, Users, CheckCircle, TrendingUp } from 'lucide-react'

export default function HomeTab({ user, dbUser, refreshUser }) {
  const [stats, setStats] = useState({ totalUsers: 0, totalTasks: 0 })

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    const { count: userCount } = await supabase
      .from('users').select('*', { count: 'exact', head: true })
    const { count: taskCount } = await supabase
      .from('tasks').select('*', { count: 'exact', head: true }).eq('is_active', true)
    setStats({ totalUsers: userCount || 0, totalTasks: taskCount || 0 })
  }

  const points = dbUser?.points || 0
  const rank = dbUser?.rank || '—'
  const tasksCompleted = dbUser?.tasks_completed || 0
  const referrals = dbUser?.referral_count || 0

  return (
    <div style={{ padding: '20px 16px' }}>
      {/* Welcome */}
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <div style={{ fontSize: '52px', marginBottom: '8px' }} className="animate-float">🐦</div>
        <h1 style={{
          fontFamily: 'Space Mono, monospace',
          fontSize: '13px',
          color: '#6b6b8a',
          letterSpacing: '3px',
          marginBottom: '4px'
        }}>WELCOME BACK</h1>
        <h2 style={{
          fontFamily: 'Space Mono, monospace',
          fontSize: '22px',
          fontWeight: 700,
          background: 'linear-gradient(135deg, #f5c842, #ff6b35)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          {dbUser?.first_name || user?.first_name || 'PECKER'}
        </h2>
      </div>

      {/* Points Card */}
      <div style={{
        background: 'linear-gradient(135deg, #1a1a0f, #1f1500)',
        border: '1px solid rgba(245,200,66,0.3)',
        borderRadius: '20px',
        padding: '24px',
        textAlign: 'center',
        marginBottom: '20px',
        position: 'relative',
        overflow: 'hidden',
      }} className="animate-pulse-gold">
        <div style={{
          position: 'absolute', top: '-20px', right: '-20px',
          width: '80px', height: '80px',
          background: 'rgba(245,200,66,0.05)',
          borderRadius: '50%'
        }} />
        <div style={{ fontSize: '12px', color: '#6b6b8a', letterSpacing: '2px', marginBottom: '8px', fontFamily: 'Space Mono, monospace' }}>
          TOTAL POINTS
        </div>
        <div style={{
          fontSize: '48px', fontWeight: 700,
          fontFamily: 'Space Mono, monospace',
          background: 'linear-gradient(135deg, #f5c842, #ff6b35)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          lineHeight: 1,
        }}>
          {points.toLocaleString()}
        </div>
        <div style={{ fontSize: '13px', color: '#6b6b8a', marginTop: '8px' }}>
          🏆 Rank #{rank === '—' ? '—' : rank}
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: '12px', marginBottom: '20px'
      }}>
        {[
          { icon: <CheckCircle size={18} color="#00e676" />, label: 'Tasks Done', value: tasksCompleted },
          { icon: <Users size={18} color="#f5c842" />, label: 'Referrals', value: referrals },
          { icon: <TrendingUp size={18} color="#ff6b35" />, label: 'Total Players', value: stats.totalUsers.toLocaleString() },
          { icon: <Zap size={18} color="#f5c842" />, label: 'Active Tasks', value: stats.totalTasks },
        ].map((stat, i) => (
          <div key={i} className="pecker-card" style={{ padding: '16px', textAlign: 'center' }}>
            <div style={{ marginBottom: '6px' }}>{stat.icon}</div>
            <div style={{ fontSize: '22px', fontWeight: 700, fontFamily: 'Space Mono, monospace', color: '#e8e8f0' }}>
              {stat.value}
            </div>
            <div style={{ fontSize: '11px', color: '#6b6b8a', marginTop: '2px' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* About PECKER */}
      <div className="pecker-card" style={{ padding: '20px', marginBottom: '16px' }}>
        <h3 style={{
          fontFamily: 'Space Mono, monospace',
          fontSize: '14px',
          color: '#f5c842',
          marginBottom: '12px',
          letterSpacing: '1px'
        }}>🐦 ABOUT PECKER</h3>
        <p style={{ fontSize: '13px', color: '#a0a0b8', lineHeight: '1.7' }}>
          PECKER is the next-generation BSC meme token with real utility.
          Complete tasks, refer friends, and earn PECKER points to secure
          your spot in the airdrop. The more you do, the more you earn!
        </p>
        <a
          href="https://t.me/PECKER_BSC"
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'block',
            marginTop: '14px',
            padding: '12px',
            background: 'rgba(245,200,66,0.1)',
            border: '1px solid rgba(245,200,66,0.2)',
            borderRadius: '10px',
            textAlign: 'center',
            color: '#f5c842',
            fontSize: '13px',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          📢 Join PECKER Community →
        </a>
      </div>

      {/* Wallet status banner */}
      <div
        onClick={() => {/* handled by parent via tab */}}
        style={{
          background: dbUser?.wallet_address
            ? 'rgba(0,230,118,0.06)'
            : 'rgba(245,200,66,0.06)',
          border: `1px solid ${dbUser?.wallet_address ? 'rgba(0,230,118,0.2)' : 'rgba(245,200,66,0.2)'}`,
          borderRadius: '12px',
          padding: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        <span style={{ fontSize: '22px' }}>{dbUser?.wallet_address ? '✅' : '👛'}</span>
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: '13px', fontWeight: 600,
            color: dbUser?.wallet_address ? '#00e676' : '#f5c842',
          }}>
            {dbUser?.wallet_address ? 'Wallet Registered' : 'Wallet Not Submitted Yet'}
          </div>
          <div style={{ fontSize: '11px', color: '#6b6b8a', marginTop: '2px' }}>
            {dbUser?.wallet_address
              ? `${dbUser.wallet_address.slice(0, 6)}...${dbUser.wallet_address.slice(-6)}`
              : 'Submit your BSC wallet to receive the airdrop'}
          </div>
        </div>
        {!dbUser?.wallet_address && (
          <div style={{
            background: 'linear-gradient(135deg, #f5c842, #ff6b35)',
            borderRadius: '8px', padding: '6px 12px',
            fontSize: '12px', fontWeight: 700, color: '#0a0a0f',
            fontFamily: 'Space Mono, monospace', flexShrink: 0,
          }}>
            +200 pts
          </div>
        )}
      </div>

      {/* Daily reminder */}
      <div style={{
        background: 'rgba(255,107,53,0.08)',
        border: '1px solid rgba(255,107,53,0.2)',
        borderRadius: '12px',
        padding: '14px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}>
        <span style={{ fontSize: '24px' }}>⏰</span>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#ff6b35' }}>Daily Tasks Reset!</div>
          <div style={{ fontSize: '12px', color: '#6b6b8a', marginTop: '2px' }}>Check in every day to earn bonus points</div>
        </div>
      </div>
    </div>
  )
}
