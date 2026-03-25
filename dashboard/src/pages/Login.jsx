import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/axios'
import socket from '../lib/socket'
import VoxLogo from '../components/VoxLogo'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const navigate = useNavigate()

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/auth/login', { email, password })
      const { token } = res.data
      localStorage.setItem('vox_token', token)
      const payload = JSON.parse(atob(token.split('.')[1]))
      localStorage.setItem('vox_client_id', payload.clientId)
      socket.connect()
      socket.emit('join_client_room', { clientId: payload.clientId })
      navigate('/conversations')
    } catch {
      setError('Email ou mot de passe incorrect.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ ...s.root, flexDirection: isMobile ? 'column' : 'row' }}>

      {/* Bandeau branding — pleine largeur sur mobile, colonne sur desktop */}
      <div style={{ ...s.brand, ...(isMobile ? s.brandMobile : s.brandDesktop) }}>
        <VoxLogo height={isMobile ? 28 : 36} white />
        {!isMobile && (
          <>
            <div style={s.pitch}>
              <h1 style={s.pitchTitle}>Chaque conversation<br />compte.</h1>
              <p style={s.pitchSub}>Répondez à vos visiteurs en temps réel et transformez chaque échange en opportunité.</p>
            </div>
            <div style={s.stats}>
              {[['98%','Satisfaction'],['<2min','Réponse'],['3x','Conversions']].map(([v,l]) => (
                <div key={l} style={s.stat}>
                  <div style={s.statVal}>{v}</div>
                  <div style={s.statLbl}>{l}</div>
                </div>
              ))}
            </div>
          </>
        )}
        <div style={s.gradBar} />
      </div>

      {/* Formulaire */}
      <div style={{ ...s.formSide, ...(isMobile ? s.formSideMobile : {}) }}>
        <div style={{ ...s.card, ...(isMobile ? s.cardMobile : {}) }}>
          {isMobile && (
            <div style={s.mobileWelcome}>
              <h2 style={s.mobileTitle}>Connexion</h2>
              <p style={s.mobileSub}>Accédez à votre espace agent</p>
            </div>
          )}
          {!isMobile && (
            <div style={{ marginBottom: 28 }}>
              <h2 style={s.formTitle}>Connexion</h2>
              <p style={s.formSub}>Accédez à votre espace agent</p>
            </div>
          )}

          {error && (
            <div style={s.errorBox}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} style={s.form}>
            <Field label="Adresse email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="vous@entreprise.fr" />
            <Field label="Mot de passe" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
            <button style={{ ...s.btn, opacity: loading ? 0.75 : 1 }} type="submit" disabled={loading}>
              {loading ? 'Connexion...' : 'Se connecter →'}
            </button>
          </form>
        </div>
      </div>

      {/* Décos desktop */}
      {!isMobile && <><div style={s.glow1}/><div style={s.glow2}/></>}
    </div>
  )
}

function Field({ label, type, value, onChange, placeholder }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={s.label}>{label}</label>
      <input
        style={{ ...s.input, borderColor: focused ? '#5e60ce' : '#e8edf3', boxShadow: focused ? '0 0 0 3px rgba(94,96,206,0.12)' : 'none' }}
        type={type} value={value} onChange={onChange} placeholder={placeholder} required
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      />
    </div>
  )
}

const s = {
  root: { display: 'flex', minHeight: '100vh', fontFamily: "'Plus Jakarta Sans', sans-serif" },

  brand: { background: '#11243e', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  brandDesktop: { flex: '0 0 440px', alignItems: 'flex-start', justifyContent: 'center', padding: '52px 48px', gap: 48 },
  brandMobile: { padding: '24px 24px 28px', gap: 0, alignItems: 'flex-start', justifyContent: 'flex-start' },

  pitch: { display: 'flex', flexDirection: 'column', gap: 16 },
  pitchTitle: { fontSize: 38, fontWeight: 800, color: '#fff', lineHeight: 1.15, letterSpacing: '-0.8px' },
  pitchSub: { fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.75, maxWidth: 320 },
  stats: { display: 'flex', gap: 28 },
  stat: { display: 'flex', flexDirection: 'column', gap: 3 },
  statVal: { fontSize: 20, fontWeight: 800, background: 'linear-gradient(135deg,#56cfe1,#5e60ce)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.4px' },
  statLbl: { fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 500 },
  gradBar: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg,#defcb9,#56cfe1,#5e60ce,#7400b8)' },
  glow1: { position: 'absolute', width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle,rgba(94,96,206,0.2) 0%,transparent 70%)', top: -60, right: -60, pointerEvents: 'none' },
  glow2: { position: 'absolute', width: 240, height: 240, borderRadius: '50%', background: 'radial-gradient(circle,rgba(86,207,225,0.12) 0%,transparent 70%)', bottom: -30, left: -40, pointerEvents: 'none' },

  formSide: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f7fa', padding: 40 },
  formSideMobile: { padding: '28px 20px 40px', alignItems: 'flex-start' },

  card: { width: '100%', maxWidth: 400, background: '#fff', borderRadius: 20, padding: '44px', boxShadow: '0 8px 40px rgba(17,36,62,0.09)', border: '1px solid #e8edf3' },
  cardMobile: { padding: '28px 24px', borderRadius: 16, boxShadow: '0 4px 20px rgba(17,36,62,0.08)', maxWidth: '100%' },

  mobileWelcome: { marginBottom: 24 },
  mobileTitle: { fontSize: 22, fontWeight: 800, color: '#11243e', letterSpacing: '-0.4px', marginBottom: 4 },
  mobileSub: { fontSize: 13, color: '#8fa3bc' },

  formTitle: { fontSize: 22, fontWeight: 800, color: '#11243e', letterSpacing: '-0.4px', marginBottom: 6 },
  formSub: { fontSize: 14, color: '#8fa3bc' },

  errorBox: { display: 'flex', alignItems: 'center', gap: 8, background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '11px 14px', borderRadius: 10, fontSize: 13, fontWeight: 500, marginBottom: 20 },

  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  label: { fontSize: 13, fontWeight: 600, color: '#11243e' },
  input: { padding: '12px 14px', borderRadius: 10, border: '1.5px solid #e8edf3', fontSize: 14, color: '#11243e', outline: 'none', background: '#fafbfc', transition: 'border-color 0.15s, box-shadow 0.15s', width: '100%' },
  btn: { marginTop: 6, padding: '13px 20px', background: 'linear-gradient(135deg,#5e60ce 0%,#7400b8 100%)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'opacity 0.15s', width: '100%' },
}
