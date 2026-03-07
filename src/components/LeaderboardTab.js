import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Trophy, Medal } from 'lucide-react'

export default function LeaderboardTab({ user, dbUser }) {
  const [leaders, setLeaders] = useState([])
  const [loading, setLoading] = useState(true)
  const [myRank, setMyRank] = useState(null)

  useEffect(() => {
    fetchLeaderboard()
  }, [])

  const fetchLeaderboard = async () => {
    const { data } = await supabase
      .from('users')
      .select('telegram_id, username, first_name, last_name, points, referral_count, tasks_completed, photo_url')
      .order('points', { ascending: false })
      .limit(100)

    if (data) {
      setLeaders(data)
      const rank = data.findIndex(u => u.telegram_id === user?.id)
      setMyRank(rank >= 0 ? rank + 1 : null)
    }
    setLoading(false)
  }

  const getRankBadge = (rank) => {
    if (rank === 1) return { emoji: '🥇', color: '#ffd700', bg: 'rgba(255,215,0,0.15)' }
    if (rank === 2) return { emoji: '🥈', color: '#c0c0c0', bg: 'rgba(192,192,192,0.15)' }
    if (rank === 3) return { emoji: '🥉', color: '#cd7f32', bg: 'rgba(205,127,50,0.15)' }
    return { emoji: null, color: '#6b6b8a', bg: 'transparent' }
  }

  const displayName = (u) => {
    if (u.username) return `@${u.username}`
    const name = [u.first_name, u.last_name].filter(Boolean).join(' ')
    return name || `User${u.telegram_id}`
  }

  if (loading) {
    return (
      <div style={{ padding: '20px 16px' }}>
        {[1,2,3,4,5].map(i => (
          <div key={i} className="shimmer" style={{ height: '64px', borderRadius: '14px', marginBottom: '10px' }} />
        ))}
      </div>
    )
  }

  return (
    <div style={{ padding: '20px 16px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{ fontSize: '40px', marginBottom: '8px' }}>🏆</div>
        <h2 style={{
          fontFamily: 'Space Mono, monospace',
          fontSize: '18px', fontWeight: 700,
          background: 'linear-gradient(135deg, #f5c842, #ff6b35)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>LEADERBOARD</h2>
        <p style={{ fontSize: '12px', color: '#6b6b8a', marginTop: '4px' }}>Top PECKER earners</p>
      </div>

      {/* My rank card */}
      {myRank && dbUser && (
        <div style={{
          background: 'rgba(245,200,66,0.08)',
          border: '1px solid rgba(245,200,66,0.3)',
          borderRadius: '14px',
          padding: '14px 16px',
          marginBottom: '20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px', height: '36px',
              background: 'linear-gradient(135deg, #f5c842, #ff6b35)',
              borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Space Mono, monospace', fontSize: '14px', fontWeight: 700, color: '#0a0a0f',
            }}>#{myRank}</div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#f5c842' }}>Your Rank</div>
              <div style={{ fontSize: '12px', color: '#6b6b8a' }}>{displayName(dbUser)}</div>
            </div>
          </div>
          <div style={{
            fontFamily: 'Space Mono, monospace',
            fontSize: '16px', fontWeight: 700, color: '#f5c842',
          }}>
            {(dbUser.points || 0).toLocaleString()} pts
          </div>
        </div>
      )}

      {/* Top 3 podium */}
      {leaders.length >= 3 && (
        <div style={{
          display: 'flex', alignItems: 'flex-end',
          gap: '8px', marginBottom: '20px',
          height: '120px',
        }}>
          {[leaders[1], leaders[0], leaders[2]].map((leader, i) => {
            const realRank = i === 0 ? 2 : i === 1 ? 1 : 3
            const heights = [90, 120, 75]
            const colors = ['#c0c0c0', '#ffd700', '#cd7f32']
            return (
              <div key={leader.telegram_id} style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'flex-end',
              }}>
                <div style={{ fontSize: '20px', marginBottom: '4px' }}>
                  {['🥈','🥇','🥉'][i]}
                </div>
                <div style={{ fontSize: '11px', color: '#e8e8f0', marginBottom: '4px', textAlign: 'center', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {displayName(leader)}
                </div>
                <div style={{
                  width: '100%', height: `${heights[i]}px`,
                  background: `linear-gradient(180deg, ${colors[i]}22, ${colors[i]}44)`,
                  border: `1px solid ${colors[i]}66`,
                  borderRadius: '10px 10px 0 0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexDirection: 'column',
                }}>
                  <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '12px', fontWeight: 700, color: colors[i] }}>
                    #{realRank}
                  </div>
                  <div style={{ fontSize: '10px', color: colors[i], opacity: 0.8 }}>
                    {(leader.points || 0).toLocaleString()}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Full list */}
      <div>
        {leaders.map((leader, index) => {
          const rank = index + 1
          const badge = getRankBadge(rank)
          const isMe = leader.telegram_id === user?.id

          return (
            <div
              key={leader.telegram_id}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '12px 14px',
                background: isMe ? 'rgba(245,200,66,0.08)' : (index % 2 === 0 ? '#13131f' : 'transparent'),
                border: isMe ? '1px solid rgba(245,200,66,0.3)' : '1px solid transparent',
                borderRadius: '12px',
                marginBottom: '6px',
                transition: 'all 0.2s',
              }}
            >
              {/* Rank */}
              <div style={{
                width: '32px', height: '32px', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: badge.bg, borderRadius: '8px',
                fontFamily: 'Space Mono, monospace', fontSize: '12px',
                fontWeight: 700, color: badge.color,
              }}>
                {badge.emoji || `#${rank}`}
              </div>

              {/* Avatar */}
              <div style={{
                width: '36px', height: '36px', flexShrink: 0,
                background: 'linear-gradient(135deg, #f5c842, #ff6b35)',
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px', fontWeight: 700, color: '#0a0a0f',
                fontFamily: 'Space Mono, monospace',
              }}>
                {(leader.first_name || 'U').charAt(0).toUpperCase()}
              </div>

              {/* Name & stats */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '14px', fontWeight: 600,
                  color: isMe ? '#f5c842' : '#e8e8f0',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {displayName(leader)} {isMe && '(you)'}
                </div>
                <div style={{ fontSize: '11px', color: '#6b6b8a', marginTop: '1px' }}>
                  {leader.tasks_completed || 0} tasks • {leader.referral_count || 0} refs
                </div>
              </div>

              {/* Points */}
              <div style={{
                fontFamily: 'Space Mono, monospace',
                fontSize: '14px', fontWeight: 700,
                color: rank <= 3 ? badge.color : '#e8e8f0',
                flexShrink: 0,
              }}>
                {(leader.points || 0).toLocaleString()}
              </div>
            </div>
          )
        })}
      </div>

      {leaders.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6b6b8a' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🏆</div>
          <div>Be the first on the leaderboard!</div>
        </div>
      )}
    </div>
  )
}
