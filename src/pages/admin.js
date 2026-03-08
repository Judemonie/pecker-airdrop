import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function AdminPanel() {
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [tasks, setTasks] = useState([])
  const [users, setUsers] = useState([])
  const [section, setSection] = useState('tasks')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState({ msg: '', type: 'success' })
  const [newTask, setNewTask] = useState({ title: '', description: '', task_type: 'telegram', url: '', icon: '', points: 100 })
  const [giftUser, setGiftUser] = useState({ telegram_id: '', points: '', action: 'gift' })
  const [stats, setStats] = useState({ totalUsers: 0, walletsSubmitted: 0, bannedUsers: 0 })
  const [searchUser, setSearchUser] = useState('')
  const [wrongPass, setWrongPass] = useState(false)

  useEffect(() => { if (authed) { fetchAll() } }, [authed])

  const checkPassword = () => {
    if (password === 'pecker2024admin') {
      setWrongPass(false)
      setAuthed(true)
    } else {
      setWrongPass(true)
    }
  }

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast({ msg: '', type: 'success' }), 3000)
  }

  const fetchAll = async () => { await Promise.all([fetchTasks(), fetchUsers(), fetchStats()]) }

  const fetchTasks = async () => {
    const { data } = await supabase.from('tasks').select('*').order('created_at', { ascending: false })
    setTasks(data || [])
  }

  const fetchUsers = async () => {
    const { data } = await supabase.from('users').select('*').order('points', { ascending: false })
    setUsers(data || [])
  }

  const fetchStats = async () => {
    const { count: total } = await supabase.from('users').select('*', { count: 'exact', head: true })
    const { count: wallets } = await supabase.from('users').select('*', { count: 'exact', head: true }).not('wallet_address', 'is', null)
    const { count: banned } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('is_banned', true)
    setStats({ totalUsers: total || 0, walletsSubmitted: wallets || 0, bannedUsers: banned || 0 })
  }

  const addTask = async () => {
    if (!newTask.title || !newTask.points) { showToast('Title and points required!', 'error'); return }
    setLoading(true)
    const { error } = await supabase.from('tasks').insert({ ...newTask, points: parseInt(newTask.points), is_active: true })
    if (error) { showToast('Error: ' + error.message, 'error') }
    else { showToast('Task added!'); setNewTask({ title: '', description: '', task_type: 'telegram', url: '', icon: '', points: 100 }); fetchTasks() }
    setLoading(false)
  }

  const toggleTask = async (task) => {
    const { error } = await supabase.from('tasks').update({ is_active: !task.is_active }).eq('id', task.id)
    if (error) { showToast('Error', 'error') }
    else { showToast(task.is_active ? 'Task disabled' : 'Task enabled'); fetchTasks() }
  }

  const deleteTask = async (id) => {
    if (!confirm('Delete this task?')) return
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (error) { showToast('Error', 'error') }
    else { showToast('Task deleted'); fetchTasks() }
  }

  const banUser = async (u) => {
    if (!confirm((u.is_banned ? 'Unban ' : 'Ban ') + u.first_name + '?')) return
    const { error } = await supabase.from('users').update({ is_banned: !u.is_banned }).eq('telegram_id', u.telegram_id)
    if (error) { showToast('Error', 'error') }
    else { showToast(u.is_banned ? u.first_name + ' unbanned' : u.first_name + ' banned'); fetchUsers(); fetchStats() }
  }

  const handlePoints = async () => {
    if (!giftUser.telegram_id) { showToast('Select a user first!', 'error'); return }
    if (giftUser.action !== 'reset' && !giftUser.points) { showToast('Enter points amount!', 'error'); return }
    if (!confirm(giftUser.action === 'reset' ? 'Reset to 0?' : giftUser.action === 'deduct' ? 'Deduct ' + giftUser.points + ' pts?' : 'Gift ' + giftUser.points + ' pts?')) return
    setLoading(true)
    let error
    if (giftUser.action === 'reset') {
      const res = await supabase.from('users').update({ points: 0 }).eq('telegram_id', parseInt(giftUser.telegram_id))
      error = res.error
    } else if (giftUser.action === 'deduct') {
      const res = await supabase.rpc('add_points', { user_telegram_id: parseInt(giftUser.telegram_id), points_to_add: -Math.abs(parseInt(giftUser.points)) })
      error = res.error
    } else {
      const res = await supabase.rpc('add_points', { user_telegram_id: parseInt(giftUser.telegram_id), points_to_add: parseInt(giftUser.points) })
      error = res.error
    }
    if (error) { showToast('Error: ' + error.message, 'error') }
    else { showToast('Done!'); setGiftUser({ telegram_id: '', points: '', action: 'gift' }); fetchUsers() }
    setLoading(false)
  }

  const exportCSV = (walletsOnly) => {
    const list = walletsOnly ? users.filter(u => u.wallet_address) : users
    const csv = ['Rank,Telegram ID,Username,Name,Wallet,Points,Referrals,Banned',
      ...list.map((u, i) => i+1+','+u.telegram_id+','+(u.username||'')+','+(u.first_name||'')+','+(u.wallet_address||'')+','+u.points+','+u.referral_count+','+(u.is_banned||false))
    ].join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = 'pecker-'+(walletsOnly?'snapshot':'all')+'.csv'
    a.click()
    showToast('Exported!')
  }

  const filteredUsers = users.filter(u =>
    searchUser === '' ||
    (u.first_name||'').toLowerCase().includes(searchUser.toLowerCase()) ||
    (u.username||'').toLowerCase().includes(searchUser.toLowerCase()) ||
    String(u.telegram_id).includes(searchUser)
  )

  if (!authed) return (
    <div style={{ minHeight:'100vh', background:'#0a0a0f', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}>
      <div style={{ background:'#13131f', border:'1px solid #1e1e30', borderRadius:'20px', padding:'32px', width:'100%', maxWidth:'380px' }}>
        <div style={{ textAlign:'center', marginBottom:'24px' }}>
          <div style={{ fontSize:'40px' }}>🔐</div>
          <h1 style={{ color:'#f5c842', fontSize:'20px', margin:'8px 0 4px' }}>ADMIN PANEL</h1>
          <p style={{ color:'#6b6b8a', fontSize:'13px' }}>PECKER Airdrop Management</p>
        </div>
        <input
          type="password"
          value={password}
          onChange={e => { setPassword(e.target.value); setWrongPass(false) }}
          onKeyDown={e => e.key === 'Enter' && checkPassword()}
          placeholder="Enter admin password"
          style={{ width:'100%', background:'#0a0a0f', border:'1px solid '+(wrongPass?'#ff1744':'#1e1e30'), borderRadius:'10px', padding:'14px', color:'#e8e8f0', fontSize:'14px', outline:'none', marginBottom:'12px', boxSizing:'border-box' }}
        />
        {wrongPass && <div style={{ color:'#ff1744', fontSize:'13px', marginBottom:'12px', textAlign:'center' }}>Wrong password!</div>}
        <button
          onClick={checkPassword}
          style={{ width:'100%', background:'linear-gradient(135deg,#f5c842,#ff6b35)', color:'#0a0a0f', border:'none', borderRadius:'10px', padding:'14px', fontSize:'15px', fontWeight:700, cursor:'pointer' }}>
          LOGIN
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:'#0a0a0f', color:'#e8e8f0' }}>
      {toast.msg && (
        <div style={{ position:'fixed', top:'16px', right:'16px', background:toast.type==='success'?'rgba(0,230,118,0.15)':'rgba(255,23,68,0.15)', border:'1px solid '+(toast.type==='success'?'#00e676':'#ff1744'), borderRadius:'12px', padding:'12px 20px', color:toast.type==='success'?'#00e676':'#ff1744', fontSize:'14px', fontWeight:600, zIndex:999 }}>
          {toast.msg}
        </div>
      )}
      <div style={{ background:'#13131f', borderBottom:'1px solid #1e1e30', padding:'14px 20px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <span style={{ fontSize:'16px', fontWeight:700, color:'#f5c842' }}>PECKER ADMIN</span>
        <button onClick={() => setAuthed(false)} style={{ background:'rgba(255,23,68,0.1)', border:'1px solid rgba(255,23,68,0.3)', borderRadius:'8px', padding:'6px 14px', color:'#ff1744', fontSize:'12px', cursor:'pointer' }}>Logout</button>
      </div>

      <div style={{ padding:'20px', maxWidth:'800px', margin:'0 auto' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px', marginBottom:'20px' }}>
          {[{label:'Total Users',value:stats.totalUsers,color:'#f5c842'},{label:'Wallets',value:stats.walletsSubmitted,color:'#00e676'},{label:'Banned',value:stats.bannedUsers,color:'#ff1744'}].map((s,i) => (
            <div key={i} style={{ background:'#13131f', border:'1px solid #1e1e30', borderRadius:'12px', padding:'14px', textAlign:'center' }}>
              <div style={{ fontSize:'24px', fontWeight:700, color:s.color }}>{s.value}</div>
              <div style={{ fontSize:'11px', color:'#6b6b8a', marginTop:'4px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display:'flex', gap:'8px', marginBottom:'20px', overflowX:'auto' }}>
          {[['tasks','Tasks'],['users','Users'],['gift','Points'],['snapshot','Snapshot']].map(([id,label]) => (
            <button key={id} onClick={() => setSection(id)} style={{ padding:'9px 16px', background:section===id?'linear-gradient(135deg,#f5c842,#ff6b35)':'#13131f', border:section===id?'none':'1px solid #1e1e30', borderRadius:'10px', color:section===id?'#0a0a0f':'#e8e8f0', fontSize:'12px', fontWeight:600, cursor:'pointer', whiteSpace:'nowrap' }}>
              {label}
            </button>
          ))}
        </div>

        {section==='tasks' && (
          <div>
            <div style={{ background:'#13131f', border:'1px solid #1e1e30', borderRadius:'14px', padding:'18px', marginBottom:'20px' }}>
              <div style={{ fontSize:'13px', color:'#f5c842', marginBottom:'14px' }}>ADD NEW TASK</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'10px' }}>
                <input value={newTask.title} onChange={e => setNewTask({...newTask,title:e.target.value})} placeholder="Task title *" style={{ background:'#0a0a0f', border:'1px solid #1e1e30', borderRadius:'8px', padding:'10px 12px', color:'#e8e8f0', fontSize:'13px', outline:'none' }} />
                <input value={newTask.url} onChange={e => setNewTask({...newTask,url:e.target.value})} placeholder="URL (optional)" style={{ background:'#0a0a0f', border:'1px solid #1e1e30', borderRadius:'8px', padding:'10px 12px', color:'#e8e8f0', fontSize:'13px', outline:'none' }} />
                <input value={newTask.description} onChange={e => setNewTask({...newTask,description:e.target.value})} placeholder="Description" style={{ background:'#0a0a0f', border:'1px solid #1e1e30', borderRadius:'8px', padding:'10px 12px', color:'#e8e8f0', fontSize:'13px', outline:'none' }} />
                <input value={newTask.icon} onChange={e => setNewTask({...newTask,icon:e.target.value})} placeholder="Icon emoji" style={{ background:'#0a0a0f', border:'1px solid #1e1e30', borderRadius:'8px', padding:'10px 12px', color:'#e8e8f0', fontSize:'13px', outline:'none' }} />
                <select value={newTask.task_type} onChange={e => setNewTask({...newTask,task_type:e.target.value})} style={{ background:'#0a0a0f', border:'1px solid #1e1e30', borderRadius:'8px', padding:'10px 12px', color:'#e8e8f0', fontSize:'13px', outline:'none' }}>
                  <option value="telegram">Telegram</option>
                  <option value="twitter">Twitter/X</option>
                  <option value="website">Website</option>
                  <option value="daily">Daily</option>
                  <option value="custom">Custom</option>
                </select>
                <input type="number" value={newTask.points} onChange={e => setNewTask({...newTask,points:e.target.value})} placeholder="Points *" style={{ background:'#0a0a0f', border:'1px solid #1e1e30', borderRadius:'8px', padding:'10px 12px', color:'#e8e8f0', fontSize:'13px', outline:'none' }} />
              </div>
              <button onClick={addTask} disabled={loading} style={{ background:'linear-gradient(135deg,#f5c842,#ff6b35)', color:'#0a0a0f', border:'none', borderRadius:'10px', padding:'12px 24px', fontSize:'14px', fontWeight:700, cursor:'pointer' }}>
                {loading ? 'Adding...' : 'Add Task'}
              </button>
            </div>
            <div style={{ fontSize:'12px', color:'#6b6b8a', marginBottom:'10px' }}>ALL TASKS ({tasks.length})</div>
            {tasks.map(task => (
              <div key={task.id} style={{ background:'#13131f', border:'1px solid '+(task.is_active?'#1e1e30':'rgba(255,23,68,0.2)'), borderRadius:'12px', padding:'14px', marginBottom:'8px', display:'flex', alignItems:'center', gap:'12px', opacity:task.is_active?1:0.6 }}>
                <span style={{ fontSize:'22px' }}>{task.icon||'⭐'}</span>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:'14px', fontWeight:600 }}>{task.title}</div>
                  <div style={{ fontSize:'11px', color:'#6b6b8a' }}>{task.task_type} • {task.points} pts</div>
                </div>
                <div style={{ display:'flex', gap:'6px' }}>
                  <button onClick={() => toggleTask(task)} style={{ padding:'6px 12px', background:task.is_active?'rgba(255,107,53,0.1)':'rgba(0,230,118,0.1)', border:'1px solid '+(task.is_active?'rgba(255,107,53,0.4)':'rgba(0,230,118,0.4)'), borderRadius:'8px', color:task.is_active?'#ff6b35':'#00e676', fontSize:'12px', cursor:'pointer', fontWeight:600 }}>
                    {task.is_active?'Disable':'Enable'}
                  </button>
                  <button onClick={() => deleteTask(task.id)} style={{ padding:'6px 12px', background:'rgba(255,23,68,0.1)', border:'1px solid rgba(255,23,68,0.3)', borderRadius:'8px', color:'#ff1744', fontSize:'12px', cursor:'pointer', fontWeight:600 }}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {section==='users' && (
          <div>
            <input value={searchUser} onChange={e => setSearchUser(e.target.value)} placeholder="Search by name, username or ID..."
              style={{ width:'100%', background:'#13131f', border:'1px solid #1e1e30', borderRadius:'10px', padding:'12px', color:'#e8e8f0', fontSize:'13px', outline:'none', marginBottom:'14px', boxSizing:'border-box' }} />
            <div style={{ fontSize:'12px', color:'#6b6b8a', marginBottom:'10px' }}>USERS ({filteredUsers.length})</div>
            {filteredUsers.slice(0,100).map((u,i) => (
              <div key={u.telegram_id} style={{ background:'#13131f', border:'1px solid '+(u.is_banned?'rgba(255,23,68,0.3)':'#1e1e30'), borderRadius:'12px', padding:'12px 14px', marginBottom:'8px', display:'flex', alignItems:'center', gap:'10px' }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:'13px', fontWeight:600, color:u.is_banned?'#ff1744':'#e8e8f0' }}>{u.first_name} {u.username?'(@'+u.username+')':''} {u.is_banned?'— BANNED':''}</div>
                  <div style={{ fontSize:'11px', color:'#6b6b8a' }}>ID: {u.telegram_id} • {u.points} pts • {u.referral_count} refs</div>
                </div>
                <button onClick={() => banUser(u)} style={{ padding:'6px 12px', background:u.is_banned?'rgba(0,230,118,0.1)':'rgba(255,23,68,0.1)', border:'1px solid '+(u.is_banned?'rgba(0,230,118,0.3)':'rgba(255,23,68,0.3)'), borderRadius:'8px', color:u.is_banned?'#00e676':'#ff1744', fontSize:'12px', cursor:'pointer', fontWeight:600 }}>
                  {u.is_banned?'Unban':'Ban'}
                </button>
              </div>
            ))}
          </div>
        )}

        {section==='gift' && (
          <div>
            <div style={{ background:'#13131f', border:'1px solid rgba(245,200,66,0.2)', borderRadius:'14px', padding:'20px', marginBottom:'16px' }}>
              <div style={{ fontSize:'13px', color:'#f5c842', marginBottom:'16px' }}>MANAGE USER POINTS</div>
              <div style={{ display:'grid', gap:'10px' }}>
                <input value={giftUser.telegram_id} onChange={e => setGiftUser({...giftUser,telegram_id:e.target.value})} placeholder="Telegram ID (tap user below)"
                  style={{ background:'#0a0a0f', border:'1px solid #1e1e30', borderRadius:'8px', padding:'12px', color:'#e8e8f0', fontSize:'13px', outline:'none' }} />
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'8px' }}>
                  {[['gift','Gift','#00e676'],['deduct','Deduct','#ff6b35'],['reset','Reset to 0','#ff1744']].map(([val,label,color]) => (
                    <button key={val} onClick={() => setGiftUser({...giftUser,action:val})}
                      style={{ padding:'10px 6px', background:giftUser.action===val?color+'22':'#0a0a0f', border:'1px solid '+(giftUser.action===val?color:'#1e1e30'), borderRadius:'8px', color:giftUser.action===val?color:'#6b6b8a', fontSize:'11px', fontWeight:600, cursor:'pointer' }}>
                      {label}
                    </button>
                  ))}
                </div>
                {giftUser.action!=='reset' && (
                  <input type="number" value={giftUser.points} onChange={e => setGiftUser({...giftUser,points:e.target.value})} placeholder="Points amount"
                    style={{ background:'#0a0a0f', border:'1px solid #1e1e30', borderRadius:'8px', padding:'12px', color:'#e8e8f0', fontSize:'13px', outline:'none' }} />
                )}
                <button onClick={handlePoints} disabled={loading}
                  style={{ background:giftUser.action==='reset'?'#ff1744':giftUser.action==='deduct'?'#ff6b35':'linear-gradient(135deg,#f5c842,#ff6b35)', color:'#0a0a0f', border:'none', borderRadius:'10px', padding:'14px', fontSize:'14px', fontWeight:700, cursor:'pointer' }}>
                  {loading?'Processing...':giftUser.action==='reset'?'Reset to 0':giftUser.action==='deduct'?'Deduct Points':'Gift Points'}
                </button>
              </div>
            </div>
            <div style={{ fontSize:'12px', color:'#6b6b8a', marginBottom:'10px' }}>TAP USER TO SELECT</div>
            {users.slice(0,20).map(u => (
              <div key={u.telegram_id} onClick={() => setGiftUser({...giftUser,telegram_id:String(u.telegram_id)})}
                style={{ background:giftUser.telegram_id===String(u.telegram_id)?'rgba(245,200,66,0.08)':'#13131f', border:'1px solid '+(giftUser.telegram_id===String(u.telegram_id)?'rgba(245,200,66,0.3)':'#1e1e30'), borderRadius:'10px', padding:'10px 14px', marginBottom:'6px', display:'flex', justifyContent:'space-between', cursor:'pointer' }}>
                <div style={{ fontSize:'13px', color:'#e8e8f0' }}>{u.first_name} {u.username?'(@'+u.username+')':''}</div>
                <div style={{ fontSize:'12px', color:'#f5c842' }}>{u.points} pts</div>
              </div>
            ))}
          </div>
        )}

        {section==='snapshot' && (
          <div>
            <div style={{ background:'#13131f', border:'1px solid rgba(245,200,66,0.2)', borderRadius:'14px', padding:'24px', marginBottom:'14px' }}>
              <div style={{ fontSize:'13px', color:'#f5c842', marginBottom:'8px' }}>AIRDROP SNAPSHOT</div>
              <div style={{ fontSize:'13px', color:'#6b6b8a', marginBottom:'16px' }}>{stats.walletsSubmitted} wallets out of {stats.totalUsers} users.</div>
              <button onClick={() => exportCSV(true)} style={{ width:'100%', background:'linear-gradient(135deg,#f5c842,#ff6b35)', color:'#0a0a0f', border:'none', borderRadius:'10px', padding:'14px', fontSize:'14px', fontWeight:700, cursor:'pointer', marginBottom:'10px' }}>
                Export Wallet Snapshot (CSV)
              </button>
              <button onClick={() => exportCSV(false)} style={{ width:'100%', background:'transparent', border:'1px solid #1e1e30', color:'#a0a0b8', borderRadius:'10px', padding:'12px', fontSize:'13px', cursor:'pointer' }}>
                Export All Users (CSV)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
