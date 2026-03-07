import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { hapticFeedback } from '../lib/telegram'
import { CheckCircle, ExternalLink } from 'lucide-react'

const TASK_ICONS = {
  telegram: '📢', twitter: '🐦', website: '🌐', daily: '⚡', custom: '⭐',
}

export default function TasksTab({ user, dbUser, refreshUser }) {
  const [tasks, setTasks] = useState([])
  const [completedIds, setCompletedIds] = useState([])
  const [loading, setLoading] = useState(true)
  const [pendingVerify, setPendingVerify] = useState(null)
  const [claiming, setClaiming] = useState(null)
  const [toast, setToast] = useState(null)

  useEffect(() => { if (user) fetchTasks() }, [user])

  const fetchTasks = async () => {
    setLoading(true)
    const { data: allTasks } = await supabase.from('tasks').select('*').eq('is_active', true).order('points', { ascending: false })
    const { data: userTasks } = await supabase.from('user_tasks').select('task_id, completed_at').eq('telegram_id', user.id)
    const today = new Date().toDateString()
    const doneIds = (userTasks || []).filter(ut => {
      const task = (allTasks || []).find(t => t.id === ut.task_id)
      if (!task) return true
      if (task.task_type === 'daily') return new Date(ut.completed_at).toDateString() === today
      return true
    }).map(ut => ut.task_id)
    setTasks(allTasks || [])
    setCompletedIds(doneIds)
    setLoading(false)
  }

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleGo = (task) => {
    hapticFeedback('light')
    if (task.url) window.open(task.url, '_blank')
    setPendingVerify(task.id)
  }

  const handleVerify = async (task) => {
    if (task.title?.toLowerCase().includes('invite 3')) {
      const refCount = dbUser?.referral_count || 0
      if (refCount < 3) {
        showToast(`Need 3 referrals! You have ${refCount} so far.`, 'error')
        setPendingVerify(null)
        return
      }
    }
    setClaiming(task.id)
    setPendingVerify(null)
    const { error } = await supabase.from('user_tasks').upsert({
      telegram_id: user.id, task_id: task.id, completed_at: new Date().toISOString(),
    }, { onConflict: 'telegram_id,task_id' })
    if (!error) {
      await supabase.rpc('add_points', { user_telegram_id: user.id, points_to_add: task.points })
      setCompletedIds(prev => [...prev, task.id])
      showToast(`+${task.points} points earned! 🎉`)
      hapticFeedback('medium')
      refreshUser()
    }
    setClaiming(null)
  }

  const handleDailyCheckin = async (task) => {
    if (completedIds.includes(task.id)) return
    setClaiming(task.id)
    const { error } = await supabase.from('user_tasks').upsert({
      telegram_id: user.id, task_id: task.id, completed_at: new Date().toISOString(),
    }, { onConflict: 'telegram_id,task_id' })
    if (!error) {
      await supabase.rpc('add_points', { user_telegram_id: user.id, points_to_add: task.points })
      setCompletedIds(prev => [...prev, task.id])
      showToast(`+${task.points} points! Daily check-in done ⚡`)
      hapticFeedback('medium')
      refreshUser()
    }
    setClaiming(null)
  }

  const groupedTasks = {
    daily: tasks.filter(t => t.task_type === 'daily'),
    telegram: tasks.filter(t => t.task_type === 'telegram'),
    twitter: tasks.filter(t => t.task_type === 'twitter'),
    website: tasks.filter(t => t.task_type === 'website'),
    custom: tasks.filter(t => t.task_type === 'custom'),
  }

  const totalPoints = tasks.reduce((sum, t) => sum + t.points, 0)
  const earnedPoints = tasks.filter(t => completedIds.includes(t.id)).reduce((sum, t) => sum + t.points, 0)

  if (loading) return (
    <div style={{ padding: '20px 16px' }}>
      {[1,2,3].map(i => <div key={i} className="shimmer" style={{ height: '80px', borderRadius: '14px', marginBottom: '12px' }} />)}
    </div>
  )

  return (
    <div style={{ padding: '20px 16px' }}>
      {toast && (
        <div style={{ position: 'fixed', top: '70px', left: '50%', transform: 'translateX(-50%)', background: toast.type === 'success' ? 'rgba(0,230,118,0.15)' : 'rgba(255,23,68,0.15)', border: `1px solid ${toast.type === 'success' ? '#00e676' : '#ff1744'}`, borderRadius: '12px', padding: '12px 20px', color: toast.type === 'success' ? '#00e676' : '#ff1744', fontSize: '14px', fontWeight: 600, zIndex: 200, backdropFilter: 'blur(10px)', whiteSpace: 'nowrap' }} className="animate-slide-up">
          {toast.msg}
        </div>
      )}

      <div className="pecker-card" style={{ padding: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '13px', color: '#6b6b8a' }}>Tasks Progress</span>
          <span style={{ fontSize: '13px', fontFamily: 'Space Mono, monospace', color: '#f5c842' }}>{completedIds.length}/{tasks.length}</span>
        </div>
        <div style={{ background: '#1e1e30', borderRadius: '6px', height: '6px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${tasks.length > 0 ? (completedIds.length / tasks.length) * 100 : 0}%`, background: 'linear-gradient(90deg, #f5c842, #ff6b35)', borderRadius: '6px', transition: 'width 0.5s ease' }} />
        </div>
        <div style={{ fontSize: '12px', color: '#6b6b8a', marginTop: '8px', textAlign: 'right' }}>{earnedPoints} / {totalPoints} pts earned</div>
      </div>

      {Object.entries(groupedTasks).map(([type, typeTasks]) => {
        if (typeTasks.length === 0) return null
        return (
          <div key={type} style={{ marginBottom: '24px' }}>
            <h3 style={{ fontFamily: 'Space Mono, monospace', fontSize: '12px', letterSpacing: '2px', color: '#6b6b8a', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {TASK_ICONS[type]} {type.toUpperCase()} TASKS
              {type === 'daily' && <span style={{ background: 'rgba(255,107,53,0.15)', border: '1px solid rgba(255,107,53,0.3)', borderRadius: '6px', padding: '2px 8px', fontSize: '10px', color: '#ff6b35' }}>RESETS DAILY</span>}
            </h3>
            {typeTasks.map(task => {
              const done = completedIds.includes(task.id)
              const isClaiming = claiming === task.id
              const isWaitingVerify = pendingVerify === task.id
              return (
                <div key={task.id} className={`task-card ${done ? 'completed' : ''}`} style={{ marginBottom: '10px', opacity: done ? 0.8 : 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ fontSize: '24px' }}>{task.icon || TASK_ICONS[task.task_type]}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#e8e8f0', marginBottom: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</div>
                      <div style={{ fontSize: '12px', color: '#6b6b8a' }}>{task.description}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '14px', fontWeight: 700, color: done ? '#00e676' : '#f5c842' }}>+{task.points}</div>
                      <div style={{ fontSize: '10px', color: '#6b6b8a' }}>pts</div>
                    </div>
                  </div>

                  {!done && task.task_type === 'daily' && (
                    <button onClick={() => handleDailyCheckin(task)} disabled={isClaiming} className="gold-btn" style={{ marginTop: '12px', padding: '10px' }}>
                      {isClaiming ? '⏳ Processing...' : '⚡ Check In Now'}
                    </button>
                  )}

                  {!done && task.task_type !== 'daily' && !isWaitingVerify && !isClaiming && (
                    <button onClick={() => handleGo(task)} className="gold-btn" style={{ marginTop: '12px', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <ExternalLink size={14} /> Go & Complete Task
                    </button>
                  )}

                  {!done && isWaitingVerify && (
                    <div>
                      <div style={{ margin: '10px 0 8px', fontSize: '12px', color: '#f5c842', textAlign: 'center' }}>
                        ✅ Done? Tap verify to claim your points!
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <button onClick={() => setPendingVerify(null)} style={{ padding: '10px', background: 'transparent', border: '1px solid #1e1e30', borderRadius: '10px', color: '#6b6b8a', fontSize: '13px', cursor: 'pointer' }}>
                          Not Yet
                        </button>
                        <button onClick={() => handleVerify(task)} className="gold-btn" style={{ padding: '10px' }}>
                          ✅ Verify & Claim
                        </button>
                      </div>
                    </div>
                  )}

                  {!done && isClaiming && (
                    <div style={{ marginTop: '10px', textAlign: 'center', color: '#f5c842', fontSize: '13px' }}>⏳ Verifying...</div>
                  )}

                  {done && (
                    <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#00e676', fontSize: '13px', fontWeight: 600 }}>
                      <CheckCircle size={16} /> Completed
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )
      })}

      {tasks.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6b6b8a' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>📋</div>
          <div>No tasks available yet. Check back soon!</div>
        </div>
      )}
    </div>
  )
}
