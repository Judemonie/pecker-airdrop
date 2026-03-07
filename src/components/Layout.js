import { Home, CheckSquare, Trophy, Users, Wallet } from 'lucide-react'

export default function Layout({ children, activeTab, setActiveTab, dbUser }) {
  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'leaderboard', label: 'Ranks', icon: Trophy },
    { id: 'referral', label: 'Refer', icon: Users },
    { id: 'wallet', label: 'Wallet', icon: Wallet },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', paddingBottom: '80px' }}>
      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(10,10,15,0.95)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid #1e1e30',
        padding: '12px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '22px' }}>🐦</span>
          <span style={{
            fontFamily: 'Space Mono, monospace',
            fontSize: '18px',
            fontWeight: 700,
            background: 'linear-gradient(135deg, #f5c842, #ff6b35)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>PECKER</span>
        </div>
        <div style={{
          background: 'rgba(245,200,66,0.1)',
          border: '1px solid rgba(245,200,66,0.3)',
          borderRadius: '8px',
          padding: '4px 10px',
          fontSize: '11px',
          color: '#f5c842',
          fontFamily: 'Space Mono, monospace',
          letterSpacing: '1px'
        }}>AIRDROP</div>
      </div>

      {/* Main content */}
      <main style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </main>

      {/* Bottom nav */}
      <div className="bottom-nav">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`nav-item ${activeTab === id ? 'active' : ''}`}
            onClick={() => setActiveTab(id)}
            style={{ position: 'relative' }}
          >
            <Icon size={20} color={activeTab === id ? '#f5c842' : '#6b6b8a'} />
            {id === 'wallet' && dbUser?.wallet_address && (
              <div style={{
                position: 'absolute', top: '4px', right: '10px',
                width: '7px', height: '7px',
                background: '#00e676',
                borderRadius: '50%',
                border: '1px solid #0a0a0f',
              }} />
            )}
            <span>{label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
