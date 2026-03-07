import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { hapticFeedback } from '../lib/telegram'
import { Wallet, CheckCircle, AlertCircle, Edit3, Shield, Copy, ChevronRight } from 'lucide-react'

const BSC_REGEX = /^0x[a-fA-F0-9]{40}$/

export default function WalletTab({ user, dbUser, refreshUser }) {
  const [wallet, setWallet] = useState('')
  const [savedWallet, setSavedWallet] = useState(null)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState(null)
  const [copied, setCopied] = useState(false)
  const [confirmChange, setConfirmChange] = useState(false)

  useEffect(() => {
    if (dbUser?.wallet_address) {
      setSavedWallet(dbUser.wallet_address)
      setWallet(dbUser.wallet_address)
    }
  }, [dbUser])

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const validateWallet = (addr) => {
    if (!addr) return 'Please enter your BSC wallet address'
    if (!BSC_REGEX.test(addr)) return 'Invalid BSC address. Must start with 0x and be 42 characters'
    return null
  }

  const handleSave = async () => {
    const err = validateWallet(wallet)
    if (err) { setError(err); return }
    if (savedWallet && !confirmChange) {
      setConfirmChange(true)
      return
    }

    setSaving(true)
    setError('')
    hapticFeedback('medium')

    const { error: dbError } = await supabase
      .from('users')
      .update({
        wallet_address: wallet.toLowerCase(),
        wallet_submitted_at: new Date().toISOString(),
      })
      .eq('telegram_id', user.id)

    if (dbError) {
      setError('Failed to save. Please try again.')
      setSaving(false)
      return
    }

    // Award points if first time submitting wallet
    if (!savedWallet) {
      await supabase.rpc('add_points', {
        user_telegram_id: user.id,
        points_to_add: 200,
      })
      showToast('Wallet saved! +200 bonus points 🎉')
    } else {
      showToast('Wallet address updated! ✅')
    }

    setSavedWallet(wallet.toLowerCase())
    setEditing(false)
    setConfirmChange(false)
    setSaving(false)
    refreshUser()
  }

  const handleEdit = () => {
    hapticFeedback('light')
    setEditing(true)
    setConfirmChange(false)
    setError('')
  }

  const handleCancel = () => {
    setWallet(savedWallet || '')
    setEditing(false)
    setConfirmChange(false)
    setError('')
  }

  const copyWallet = () => {
    if (!savedWallet) return
    hapticFeedback('light')
    navigator.clipboard?.writeText(savedWallet) ||
      (() => {
        const el = document.createElement('textarea')
        el.value = savedWallet
        document.body.appendChild(el)
        el.select()
        document.execCommand('copy')
        document.body.removeChild(el)
      })()
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const maskWallet = (addr) => {
    if (!addr) return ''
    return `${addr.slice(0, 6)}...${addr.slice(-6)}`
  }

  const isValid = BSC_REGEX.test(wallet)

  return (
    <div style={{ padding: '20px 16px' }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '70px', left: '50%', transform: 'translateX(-50%)',
          background: toast.type === 'success' ? 'rgba(0,230,118,0.15)' : 'rgba(255,23,68,0.15)',
          border: `1px solid ${toast.type === 'success' ? '#00e676' : '#ff1744'}`,
          borderRadius: '12px', padding: '12px 20px',
          color: toast.type === 'success' ? '#00e676' : '#ff1744',
          fontSize: '14px', fontWeight: 600, zIndex: 200,
          backdropFilter: 'blur(10px)', whiteSpace: 'nowrap',
        }} className="animate-slide-up">
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <div style={{
          width: '64px', height: '64px',
          background: savedWallet
            ? 'linear-gradient(135deg, rgba(0,230,118,0.15), rgba(0,230,118,0.05))'
            : 'linear-gradient(135deg, rgba(245,200,66,0.15), rgba(255,107,53,0.05))',
          border: `1px solid ${savedWallet ? 'rgba(0,230,118,0.3)' : 'rgba(245,200,66,0.3)'}`,
          borderRadius: '20px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px',
          fontSize: '28px',
        }}>
          {savedWallet ? '✅' : '👛'}
        </div>
        <h2 style={{
          fontFamily: 'Space Mono, monospace',
          fontSize: '18px', fontWeight: 700,
          background: 'linear-gradient(135deg, #f5c842, #ff6b35)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          marginBottom: '6px',
        }}>
          {savedWallet ? 'WALLET CONNECTED' : 'SUBMIT WALLET'}
        </h2>
        <p style={{ fontSize: '13px', color: '#6b6b8a', lineHeight: '1.5' }}>
          {savedWallet
            ? 'Your BSC wallet is registered for the airdrop'
            : 'Submit your BSC wallet to receive your PECKER airdrop'}
        </p>
      </div>

      {/* Airdrop info banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(245,200,66,0.08), rgba(255,107,53,0.05))',
        border: '1px solid rgba(245,200,66,0.2)',
        borderRadius: '16px',
        padding: '16px',
        marginBottom: '20px',
        display: 'flex', gap: '12px',
      }}>
        <span style={{ fontSize: '24px', flexShrink: 0 }}>🎁</span>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#f5c842', marginBottom: '4px' }}>
            Airdrop Distribution
          </div>
          <div style={{ fontSize: '12px', color: '#a0a0b8', lineHeight: '1.6' }}>
            Tokens will be sent directly to your BSC wallet based on your final points ranking.
            Make sure to submit the correct address — <span style={{ color: '#ff6b35' }}>this cannot be undone after the snapshot.</span>
          </div>
        </div>
      </div>

      {/* Saved wallet display */}
      {savedWallet && !editing && (
        <div style={{ marginBottom: '20px' }}>
          <div className="pecker-card" style={{ padding: '18px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: '12px',
            }}>
              <div style={{
                fontSize: '11px', color: '#00e676',
                fontFamily: 'Space Mono, monospace', letterSpacing: '1px',
                display: 'flex', alignItems: 'center', gap: '6px',
              }}>
                <CheckCircle size={12} /> WALLET REGISTERED
              </div>
              <div style={{
                fontSize: '11px', color: '#6b6b8a',
                fontFamily: 'Space Mono, monospace',
              }}>
                BSC NETWORK
              </div>
            </div>

            {/* Wallet address display */}
            <div style={{
              background: '#0a0a0f',
              border: '1px solid #1e1e30',
              borderRadius: '10px',
              padding: '14px',
              fontFamily: 'Space Mono, monospace',
              fontSize: '13px',
              color: '#e8e8f0',
              wordBreak: 'break-all',
              lineHeight: '1.6',
              marginBottom: '12px',
            }}>
              {savedWallet}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                onClick={copyWallet}
                style={{
                  padding: '11px',
                  background: copied ? 'rgba(0,230,118,0.1)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${copied ? 'rgba(0,230,118,0.3)' : '#1e1e30'}`,
                  borderRadius: '10px',
                  color: copied ? '#00e676' : '#a0a0b8',
                  fontSize: '13px', fontWeight: 600,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  cursor: 'pointer',
                }}
              >
                <Copy size={13} />
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button
                onClick={handleEdit}
                style={{
                  padding: '11px',
                  background: 'rgba(245,200,66,0.08)',
                  border: '1px solid rgba(245,200,66,0.2)',
                  borderRadius: '10px',
                  color: '#f5c842',
                  fontSize: '13px', fontWeight: 600,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  cursor: 'pointer',
                }}
              >
                <Edit3 size={13} />
                Change
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Input form - shown when no wallet saved OR editing */}
      {(!savedWallet || editing) && (
        <div style={{ marginBottom: '20px' }}>
          <div className="pecker-card" style={{ padding: '18px' }}>
            <label style={{
              fontSize: '12px', color: '#6b6b8a',
              fontFamily: 'Space Mono, monospace', letterSpacing: '1px',
              display: 'block', marginBottom: '10px',
            }}>
              BSC WALLET ADDRESS (BEP-20)
            </label>

            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={wallet}
                onChange={(e) => {
                  setWallet(e.target.value.trim())
                  setError('')
                  setConfirmChange(false)
                }}
                placeholder="0x..."
                style={{
                  width: '100%',
                  background: '#0a0a0f',
                  border: `1px solid ${error ? '#ff1744' : isValid && wallet ? '#00e676' : '#1e1e30'}`,
                  borderRadius: '10px',
                  padding: '14px 44px 14px 14px',
                  color: '#e8e8f0',
                  fontSize: '13px',
                  fontFamily: 'Space Mono, monospace',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
              />
              <div style={{
                position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
              }}>
                {wallet && (
                  isValid
                    ? <CheckCircle size={16} color="#00e676" />
                    : <AlertCircle size={16} color={error ? '#ff1744' : '#6b6b8a'} />
                )}
              </div>
            </div>

            {error && (
              <div style={{
                marginTop: '8px', fontSize: '12px', color: '#ff1744',
                display: 'flex', alignItems: 'center', gap: '6px',
              }}>
                <AlertCircle size={12} /> {error}
              </div>
            )}

            {isValid && wallet && !error && (
              <div style={{
                marginTop: '8px', fontSize: '12px', color: '#00e676',
                display: 'flex', alignItems: 'center', gap: '6px',
              }}>
                <CheckCircle size={12} /> Valid BSC address
              </div>
            )}

            {/* Confirm change warning */}
            {confirmChange && (
              <div style={{
                marginTop: '12px',
                background: 'rgba(255,23,68,0.08)',
                border: '1px solid rgba(255,23,68,0.2)',
                borderRadius: '10px',
                padding: '12px',
                fontSize: '12px',
                color: '#ff6b6b',
                lineHeight: '1.6',
              }}>
                ⚠️ You already have a wallet saved. Are you sure you want to change it? Tap Save again to confirm.
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: editing ? '1fr 1fr' : '1fr', gap: '10px', marginTop: '14px' }}>
              {editing && (
                <button
                  onClick={handleCancel}
                  style={{
                    padding: '13px',
                    background: 'transparent',
                    border: '1px solid #1e1e30',
                    borderRadius: '10px',
                    color: '#6b6b8a',
                    fontSize: '14px', fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={saving || !wallet}
                className="gold-btn"
                style={{ padding: '13px' }}
              >
                {saving ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⏳</span>
                    Saving...
                  </span>
                ) : confirmChange ? (
                  '⚠️ Confirm Change'
                ) : savedWallet ? (
                  'Update Wallet'
                ) : (
                  '💾 Save Wallet (+200 pts)'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* How to find wallet */}
      <div className="pecker-card" style={{ padding: '16px', marginBottom: '16px' }}>
        <div style={{
          fontSize: '12px', color: '#6b6b8a',
          fontFamily: 'Space Mono, monospace', letterSpacing: '1px',
          marginBottom: '12px',
        }}>
          🔍 HOW TO FIND YOUR BSC ADDRESS
        </div>
        {[
          { app: 'Trust Wallet', steps: 'Open app → Select BNB Smart Chain → Copy address' },
          { app: 'MetaMask', steps: 'Open app → Copy address at top of screen' },
          { app: 'Binance App', steps: 'Wallet → Spot → Withdraw → BNB → BEP20 address' },
          { app: 'OKX Wallet', steps: 'Assets → Deposit → Search BNB → BEP20 network' },
        ].map((item, i) => (
          <div key={i} style={{
            padding: '10px 0',
            borderBottom: i < 3 ? '1px solid #1e1e30' : 'none',
          }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#e8e8f0', marginBottom: '3px' }}>
              {item.app}
            </div>
            <div style={{ fontSize: '12px', color: '#6b6b8a' }}>{item.steps}</div>
          </div>
        ))}
      </div>

      {/* Security note */}
      <div style={{
        background: 'rgba(255,107,53,0.06)',
        border: '1px solid rgba(255,107,53,0.15)',
        borderRadius: '12px',
        padding: '14px',
        display: 'flex', gap: '10px',
      }}>
        <Shield size={16} color="#ff6b35" style={{ flexShrink: 0, marginTop: '1px' }} />
        <div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#ff6b35', marginBottom: '4px' }}>
            Security Reminder
          </div>
          <div style={{ fontSize: '12px', color: '#6b6b8a', lineHeight: '1.6' }}>
            We will NEVER ask for your private key or seed phrase. Only submit your public wallet address starting with 0x.
          </div>
        </div>
      </div>
    </div>
  )
}
