import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'pecker2024admin'

export default function AdminPanel() {
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [tasks, setTasks] = useState([])
  const [users, setUsers] = useState([])
  const [activeSection, setActiveSection] = useState('tasks')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState('')
  const [newTask, setNewTask] = useState({ title: '', description: '', task_type: 'telegram', url: '', icon: '', points: 100 })
  const [stats, setStats] = useState({ totalUsers: 0, walletsSubmitted: 0, tasksCompleted: 0 })

  useEffect(() => { if (authed) { fetchTasks(); fetchUsers(); fetchStats() } }, [authed])

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const fetchTasks = async () => {
    const { data } = await supabase.from('tasks').select('*').order('created_at', { ascending: false })
    setTasks(data || [])
  }

  const fetchUsers = async () => {
    const { data } = await supabase.from('users').select('*').order('points', { ascending: false })
    setUsers(data || [])
  }

  const fetchStats = async () => {
    const { count: totalUsers } = await supabase.from('users').select('*', { count: 'exact', head: true })
    const { count: walletsSubmitted } = await supabase.from('users').select('*', { count: 'exact', head: true }).not('wallet_address', 'is', null)
    const { count: tasksCompleted } = await supabase.from('user_tasks').select('*', { count: 'exact', head: true })
    setStats({ totalUsers: totalUsers || 0, walletsSubmitted: walletsSubmitted || 0, tasksCompleted: tasksCompleted || 0 })
  }

  const addTask = async () => {
    if (!newTask.title || !newTask.points) { showToast('Title and points are required!'); return }
    setLoading(true)
    const { error } = await supabase.from('tasks').insert({ ...newTask, is_active: true })
    if (!error) { showToast('✅ Task added!'); fetchTasks(); setNewTask({ title: '', description: '', task_type: 'telegram', url: '', icon: '', points: 100 }) }
    setLoading(false)
  }

  const toggleTask = async (task) => {
    await supabase.from('tasks').update({ is_active: !task.is_active }).eq('id', task.id)
    fetchTasks()
    showToast(task.is_active ? '⏸ Task disabled' : '▶️ Task enabled')
  }

  const deleteTask = async (id) => {
    if (!confirm('Delete this task?')) return
    await supabase.from('tasks').delete().eq('id', id)
    fetchTasks()
    showToast('🗑️ Task deleted')
  }

  const exportSnapshot = () => {
    const withWallets = users.filter(u => u.wallet_address)
    const csv = ['Rank,Telegram ID,Username,Name,Wallet Address,Points,Referrals,Tasks Completed,Joined',
      ...withWallets.map((u, i) => `${i+1},${u.telegram_id},${u.username || ''},${u.first_name || ''},${u.wallet_address},${u.points},${u.referral_count},${u.tasks_completed},${new Date(u.created_at).toLocaleDateString()}`)
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pecker-airdrop-snapshot-${new Date().toISOString().slice(0,10)}.csv`
    a.click()
    showToast('📥 Snapshot exported!')
  }

  const exportAll = () => {
    const csv = ['Rank,Telegram ID,Username,Name,Wallet Address,Points,Referrals,Tasks Completed,Joined',
      ...users.map((u, i) => `${i+1},${u.telegram_id},${u.username || ''},${u.first_name || ''},${u.wallet_address || 'NOT SUBMITTED'},${u.points},${u.referral_count},${u.tasks_completed},${new Date(u.created_at).toLocaleDateString()}`)
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pecker-all-users-${new Date().toISOString().slice(0,10)}.csv`
    a.click()
    showToast('📥 All users exported!')
  }

  // Login screen
  if (!authed) return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: '#13131f', border: '1px solid #1e1e30', borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '40px', marginBottom: '8px' }}>🔐</div>
          <h1 style={{ fontFamily: 'Space Mono, monospace', color: '#f5c842', fontSize: '20px' }}>ADMIN PANEL</h1>
          <p style={{ color: '#6b6b8a', fontSize: '13px', marginTop: '4px' }}>PECKER Airdrop Management</p>
        </div>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (password === ADMIN_PASSWORD ? setAuthed(true) : showToast('Wrong password!'))}
          placeholder="Enter admin password"
          style={{ width: '100%', background: '#0a0a0f', border: '1px solid #1e1e30', borderRadius: '10px', padding: '14px', color: '#e8e8f0', fontSize: '14px', outline: 'none', marginBottom: '12px' }}
        />
        <button
          onClick={() => password === ADMIN_PASSWORD ? setAuthed(true) : showToast('❌ Wrong password!')}
          style={{ width: '100%', background: 'linear-gradient(135deg, #f5c842, #ff6b35)', color: '#0a0a0f', border: 'none', borderRadius: '10px', padding: '14px', fontSize: '15px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Space Mono, monospace' }}
        >
          LOGIN
        </button>
        {toast && <div style={{ marginTop: '12px', textAlign: 'center', color: '#ff1744', fontSize: '13px' }}>{toast}</div>}
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#e8e8f0', fontFamily: 'DM Sans, sans-serif' }}>
      {toast && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', background: 'rgba(0,230,118,0.15)', border: '1px solid #00e676', borderRadius: '12px', padding: '12px 20px', color: '#00e676', fontSize: '14px', fontWeight: 600, zIndex: 200 }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ background: '#13131f', borderBottom: '1px solid #1e1e30', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '24px' }}>🐦</span>
          <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '18px', fontWeight: 700, background: 'linear-gradient(135deg, #f5c842, #ff6b35)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>PECKER ADMIN</span>
        </div>
        <button onClick={() => setAuthed(false)} style={{ background: 'rgba(255,23,68,0.1)', border: '1px solid rgba(255,23,68,0.3)', borderRadius: '8px', padding: '6px 14px', color: '#ff1744', fontSize: '13px', cursor: 'pointer' }}>Logout</button>
      </div>

      <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'Total Users', value: stats.totalUsers, color: '#f5c842' },
            { label: 'Wallets Submitted', value: stats.walletsSubmitted, color: '#00e676' },
            { label: 'Tasks Completed', value: stats.tasksCompleted, color: '#ff6b35' },
          ].map((s, i) => (
            <div key={i} style={{ background: '#13131f', border: '1px solid #1e1e30', borderRadius: '14px', padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'Space Mono, monospace', color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '12px', color: '#6b6b8a', marginTop: '4px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
          {['tasks', 'users', 'snapshot'].map(section => (
            <button key={section} onClick={() => setActiveSection(section)} style={{ padding: '10px 20px', background: activeSection === section ? 'linear-gradient(135deg, #f5c842, #ff6b35)' : '#13131f', border: activeSection === section ? 'none' : '1px solid #1e1e30', borderRadius: '10px', color: activeSection === section ? '#0a0a0f' : '#e8e8f0', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Space Mono, monospace', textTransform: 'uppercase', fontSize: '12px' }}>
              {section === 'tasks' ? '📋 Tasks' : section === 'users' ? '👥 Users' : '📥 Snapshot'}
            </button>
          ))}
        </div>

        {/* TASKS SECTION */}
        {activeSection === 'tasks' && (
          <div>
            {/* Add new task */}
            <div style={{ background: '#13131f', border: '1px solid #1e1e30', borderRadius: '16px', padding: '20px', marginBottom: '24px' }}>
              <h3 style={{ fontFamily: 'Space Mono, monospace', fontSize: '14px', color: '#f5c842', marginBottom: '16px' }}>➕ ADD NEW TASK</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <input value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} placeholder="Task title *" style={{ background: '#0a0a0f', border: '1px solid #1e1e30', borderRadius: '8px', padding: '10px 12px', color: '#e8e8f0', fontSize: '13px', outline: 'none' }} />
                <select value={newTask.task_type} onChange={e => setNewTask({...newTask, task_type: e.target.value})} style={{ background: '#0a0a0f', border: '1px solid #1e1e30', borderRadius: '8px', padding: '10px 12px', color: '#e8e8f0', fontSize: '13px', outline: 'none' }}>
                  <option value="telegram">📢 Telegram</option>
                  <option value="twitter">🐦 Twitter/X</option>
                  <option value="website">🌐 Website</option>
                  <option value="daily">⚡ Daily</option>
                  <option value="custom">⭐ Custom</option>
                </select>
                <input value={newTask.url} onChange={e => setNewTask({...newTask, url: e.target.value})} placeholder="URL (optional)" style={{ background: '#0a0a0f', border: '1px solid #1e1e30', borderRadius: '8px', padding: '10px 12px', color: '#e8e8f0', fontSize: '13px', outline: 'none' }} />
                <input value={newTask.points} onChange={e => setNewTask({...newTask, points: parseInt(e.target.value) || 0})} placeholder="Points *" type="number" style={{ background: '#0a0a0f', border: '1px solid #1e1e30', borderRadius: '8px', padding: '10px 12px', color: '#e8e8f0', fontSize: '13px', outline: 'none' }} />
                <input value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} placeholder="Description" style={{ background: '#0a0a0f', border: '1px solid #1e1e30', borderRadius: '8px', padding: '10px 12px', color: '#e8e8f0', fontSize: '13px', outline: 'none' }} />
                <input value={newTask.icon} onChange={e => setNewTask({...newTask, icon: e.target.value})} placeholder="Icon emoji (optional)" style={{ background: '#0a0a0f', border: '1px solid #1e1e30', borderRadius: '8px', padding: '10px 12px', color: '#e8e8f0', fontSize: '13px', outline: 'none' }} />
              </div>
              <button onClick={addTask} disabled={loading} style={{ background: 'linear-gradient(135deg, #f5c842, #ff6b35)', color: '#0a0a0f', border: 'none', borderRadius: '10px', padding: '12px 24px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Space Mono, monospace' }}>
                {loading ? 'Adding...' : '➕ Add Task'}
              </button>
            </div>

            {/* Task list */}
            <h3 style={{ fontFamily: 'Space Mono, monospace', fontSize: '13px', color: '#6b6b8a', marginBottom: '12px', letterSpacing: '1px' }}>ALL TASKS ({tasks.length})</h3>
            {tasks.map(task => (
              <div key={task.id} style={{ background: '#13131f', border: `1px solid ${task.is_active ? '#1e1e30' : 'rgba(255,23,68,0.2)'}`, borderRadius: '12px', padding: '14px 16px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px', opacity: task.is_active ? 1 : 0.6 }}>
                <span style={{ fontSize: '20px' }}>{task.icon || '⭐'}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#e8e8f0' }}>{task.title}</div>
                  <div style={{ fontSize: '11px', color: '#6b6b8a', marginTop: '2px' }}>{task.task_type} • {task.points} pts {task.url && `• ${task.url.slice(0,30)}...`}</div>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                  <button onClick={() => toggleTask(task)} style={{ padding: '6px 12px', background: task.is_active ? 'rgba(255,107,53,0.1)' : 'rgba(0,230,118,0.1)', border: `1px solid ${task.is_active ? 'rgba(255,107,53,0.3)' : 'rgba(0,230,118,0.3)'}`, borderRadius: '8px', color: task.is_active ? '#ff6b35' : '#00e676', fontSize: '12px', cursor: 'pointer' }}>
                    {task.is_active ? 'Disable' : 'Enable'}
                  </button>
                  <button onClick={() => deleteTask(task.id)} style={{ padding: '6px 12px', background: 'rgba(255,23,68,0.1)', border: '1px solid rgba(255,23,68,0.3)', borderRadius: '8px', color: '#ff1744', fontSize: '12px', cursor: 'pointer' }}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* USERS SECTION */}
        {activeSection === 'users' && (
          <div>
            <h3 style={{ fontFamily: 'Space Mono, monospace', fontSize: '13px', color: '#6b6b8a', marginBottom: '12px', letterSpacing: '1px' }}>ALL USERS ({users.length})</h3>
            {users.slice(0, 50).map((u, i) => (
              <div key={u.telegram_id} style={{ background: '#13131f', border: '1px solid #1e1e30', borderRadius: '12px', padding: '12px 16px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '28px', height: '28px', background: 'linear-gradient(135deg, #f5c842, #ff6b35)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: '#0a0a0f', flexShrink: 0 }}>
                  {i+1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#e8e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {u.first_name} {u.username ? `(@${u.username})` : ''}
                  </div>
                  <div style={{ fontSize: '11px', color: '#6b6b8a', marginTop: '2px' }}>
                    {u.wallet_address ? `💳 ${u.wallet_address.slice(0,10)}...` : '❌ No wallet'} • {u.tasks_completed} tasks • {u.referral_count} refs
                  </div>
                </div>
                <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '14px', fontWeight: 700, color: '#f5c842', flexShrink: 0 }}>
                  {u.points.toLocaleString()}
                </div>
              </div>
            ))}
            {users.length > 50 && <div style={{ textAlign: 'center', color: '#6b6b8a', fontSize: '13px', padding: '12px' }}>Showing top 50. Export CSV to see all.</div>}
          </div>
        )}

        {/* SNAPSHOT SECTION */}
        {activeSection === 'snapshot' && (
          <div>
            <div style={{ background: '#13131f', border: '1px solid rgba(245,200,66,0.2)', borderRadius: '16px', padding: '24px', marginBottom: '16px' }}>
              <h3 style={{ fontFamily: 'Space Mono, monospace', fontSize: '14px', color: '#f5c842', marginBottom: '8px' }}>📥 AIRDROP SNAPSHOT</h3>
              <p style={{ fontSize: '13px', color: '#a0a0b8', lineHeight: '1.6', marginBottom: '16px' }}>
                Export all users who submitted their BSC wallet address. This is your airdrop distribution list sorted by points.
              </p>
              <div style={{ background: '#0a0a0f', borderRadius: '10px', padding: '12px', marginBottom: '16px', fontSize: '13px', color: '#6b6b8a' }}>
                👛 <span style={{ color: '#00e676', fontWeight: 600 }}>{stats.walletsSubmitted}</span> users with wallets out of <span style={{ color: '#f5c842', fontWeight: 600 }}>{stats.totalUsers}</span> total users
              </div>
              <button onClick={exportSnapshot} style={{ width: '100%', background: 'linear-gradient(135deg, #f5c842, #ff6b35)', color: '#0a0a0f', border: 'none', borderRadius: '10px', padding: '14px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Space Mono, monospace', marginBottom: '10px' }}>
                📥 Export Wallet Snapshot (CSV)
              </button>
              <button onClick={exportAll} style={{ width: '100%', background: 'transparent', border: '1px solid #1e1e30', color: '#a0a0b8', borderRadius: '10px', padding: '12px', fontSize: '13px', cursor: 'pointer' }}>
                📊 Export All Users (CSV)
              </button>
            </div>

            <div style={{ background: 'rgba(255,107,53,0.06)', border: '1px solid rgba(255,107,53,0.15)', borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#ff6b35', marginBottom: '8px' }}>📋 How to distribute airdrop</div>
              <div style={{ fontSize: '12px', color: '#6b6b8a', lineHeight: '1.8' }}>
                1. Click "Export Wallet Snapshot" above<br/>
                2. Open the CSV file in Excel or Google Sheets<br/>
                3. Use the wallet addresses in column E to send tokens<br/>
                4. Points column shows how much each user should receive<br/>
                5. Higher points = bigger airdrop share
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
