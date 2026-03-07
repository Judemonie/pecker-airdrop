import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { hapticFeedback } from '../lib/telegram'
import { Copy, Users, Gift, ChevronRight } from 'lucide-react'

export default function ReferralTab({ user, dbUser, refreshUser }) {
  const [referrals, setReferrals] = useState([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  const botUsername = process.env.NEXT_PUBLIC_BOT_USERNAME || 'PECKER_BSC_BOT'
  const refLink = `https://t.me/${botUsername}?start=ref_${user?.id}`
  const refPoints = 500

  useEffect(() => {
    if (user) fetchReferrals()
  }, [user])

  const fetchReferrals = async () => {
    const { data } = await supabase
      .from('users')
      .select('telegram_id, first_name, username, points, created_at')
      .eq('referred_by', user.id)
      .order('created_at', { ascending: false })
    setReferrals(data || [])
    setLoading(false)
  }

  const copyLink = () => {
    hapticFeedback('medium')
    if (navigator.clipboard) {
      navigator.clipboard.writeText(refLink)
    } else {
      const el = document.createElement('textarea')
      el.value = refLink
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const shareLink = () => {
    hapticFeedback('light')
    const text = `🐦 Join PECKER Airdrop!\n\nEarn points by completing tasks and invite friends for more rewards!\n\nJoin here 👇\n${refLink}`
    window.open(`https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent(text)}`, '_blank')
  }

  return (
    <div style={{ padding: '20px 16px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{ fontSize: '40px', marginBottom: '8px' }}>👥</div>
        <h2 style={{
          fontFamily: 'Space Mono, monospace',
          fontSize: '18px', fontWeight: 700,
          background: 'linear-gradient(135deg, #f5c842, #ff6b35)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>REFER & EARN</h2>
        <p style={{ fontSize: '12px', color: '#6b6b8a', marginTop: '4px' }}>
          Earn {refPoints} pts for every friend you invite
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
        <div className="pecker-card" style={{ padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'Space Mono, monospace', color: '#f5c842' }}>
            {dbUser?.referral_count || 0}
          </div>
          <div style={{ fontSize: '12px', color: '#6b6b8a', marginTop: '4px' }}>Friends Invited</div>
        </div>
        <div className="pecker-card" style={{ padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'Space Mono, monospace', color: '#00e676' }}>
            {((dbUser?.referral_count || 0) * refPoints).toLocaleString()}
          </div>
          <div style={{ fontSize: '12px', color: '#6b6b8a', marginTop: '4px' }}>Pts from Refs</div>
        </div>
      </div>

      {/* Referral link */}
      <div className="pecker-card" style={{ padding: '16px', marginBottom: '16px' }}>
        <div style={{ fontSize: '12px', color: '#6b6b8a', marginBottom: '10px', letterSpacing: '1px', fontFamily: 'Space Mono, monospace' }}>
          YOUR INVITE LINK
        </div>
        <div style={{
          background: '#0a0a0f',
          border: '1px solid #1e1e30',
          borderRadius: '10px',
          padding: '12px',
          fontSize: '12px',
          color: '#a0a0b8',
          wordBreak: 'break-all',
          marginBottom: '12px',
          fontFamily: 'Space Mono, monospace',
        }}>
          {refLink}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <button
            onClick={copyLink}
            style={{
              padding: '12px',
              background: copied ? 'rgba(0,230,118,0.1)' : 'rgba(245,200,66,0.1)',
              border: `1px solid ${copied ? 'rgba(0,230,118,0.3)' : 'rgba(245,200,66,0.3)'}`,
              borderRadius: '10px',
              color: copied ? '#00e676' : '#f5c842',
              fontSize: '13px', fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              cursor: 'pointer',
            }}
          >
            <Copy size={14} />
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button
            onClick={shareLink}
            className="gold-btn"
            style={{ padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            📤 Share
          </button>
        </div>
      </div>

      {/* How it works */}
      <div className="pecker-card" style={{ padding: '16px', marginBottom: '20px' }}>
        <div style={{ fontSize: '12px', color: '#6b6b8a', marginBottom: '12px', letterSpacing: '1px', fontFamily: 'Space Mono, monospace' }}>
          HOW IT WORKS
        </div>
        {[
          { icon: '🔗', text: 'Share your unique invite link' },
          { icon: '👤', text: 'Friend joins PECKER Mini App' },
          { icon: '🎁', text: `You earn ${refPoints} bonus points instantly` },
          { icon: '♾️', text: 'No limit — invite as many as you want!' },
        ].map((step, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '10px 0',
            borderBottom: i < 3 ? '1px solid #1e1e30' : 'none',
          }}>
            <span style={{ fontSize: '20px' }}>{step.icon}</span>
            <span style={{ fontSize: '13px', color: '#a0a0b8' }}>{step.text}</span>
          </div>
        ))}
      </div>

      {/* Referral list */}
      <div>
        <div style={{
          fontFamily: 'Space Mono, monospace', fontSize: '12px',
          color: '#6b6b8a', letterSpacing: '1px', marginBottom: '12px',
          display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          <Users size={14} />
          YOUR REFERRALS ({referrals.length})
        </div>

        {loading && (
          <div className="shimmer" style={{ height: '60px', borderRadius: '14px' }} />
        )}

        {!loading && referrals.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '32px 20px',
            background: '#13131f', border: '1px dashed #1e1e30',
            borderRadius: '14px', color: '#6b6b8a',
          }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>🤝</div>
            <div style={{ fontSize: '14px' }}>No referrals yet</div>
            <div style={{ fontSize: '12px', marginTop: '4px' }}>Share your link to start earning!</div>
          </div>
        )}

        {!loading && referrals.map((ref, i) => (
          <div key={ref.telegram_id} style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '12px', background: '#13131f',
            border: '1px solid #1e1e30', borderRadius: '12px',
            marginBottom: '8px',
          }}>
            <div style={{
              width: '36px', height: '36px',
              background: 'linear-gradient(135deg, #f5c842, #ff6b35)',
              borderRadius: '50%', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '14px', fontWeight: 700,
              color: '#0a0a0f', fontFamily: 'Space Mono, monospace', flexShrink: 0,
            }}>
              {(ref.first_name || 'U').charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#e8e8f0' }}>
                {ref.first_name || ref.username || `User${ref.telegram_id}`}
              </div>
              <div style={{ fontSize: '11px', color: '#6b6b8a' }}>
                {ref.points || 0} pts earned
              </div>
            </div>
            <div style={{
              fontSize: '12px', color: '#00e676',
              fontFamily: 'Space Mono, monospace', fontWeight: 600,
            }}>
              +{refPoints}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
