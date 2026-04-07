import { useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import NotificationBell from './NotificationBell'
import VoxLogo from './VoxLogo'

export default function Navbar() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])

  function logout() {
    localStorage.removeItem('vox_token')
    localStorage.removeItem('vox_client_id')
    navigate('/login')
  }

  if (isMobile) return <MobileNav pathname={pathname} navigate={navigate} logout={logout} />
  return <DesktopNav pathname={pathname} navigate={navigate} logout={logout} />
}

/* ─── Desktop sidebar ─────────────────────────────────────────────────── */
function DesktopNav({ pathname, navigate, logout }) {
  return (
    <aside style={sd.aside}>
      <div style={sd.logoWrap}><VoxLogo height={34} white /></div>
      <div style={sd.divider} />

      <nav style={sd.nav}>
        <p style={sd.section}>Menu</p>
        <NavBtn active={pathname === '/conversations'} onClick={() => navigate('/conversations')} icon={<IconChat />} label="Conversations" />
        <NavBtn active={pathname === '/settings'} onClick={() => navigate('/settings')} icon={<IconSettings />} label="Paramètres" />
      </nav>

      <div style={sd.bottom}>
        <NotificationBell />
        <div style={sd.divider} />
        <div style={sd.user}>
          <div style={sd.avatar}>A</div>
          <div style={sd.userInfo}>
            <span style={sd.userName}>Agent</span>
            <span style={sd.userRole}>Support</span>
          </div>
          <button onClick={logout} style={sd.logoutBtn} title="Déconnexion">
            <IconLogout />
          </button>
        </div>
      </div>
      <div style={sd.gradLine} />
    </aside>
  )
}

function NavBtn({ active, onClick, icon, label }) {
  return (
    <button onClick={onClick} style={{ ...sd.navBtn, ...(active ? sd.navBtnActive : {}) }}>
      <span style={{ color: active ? '#fff' : 'rgba(255,255,255,0.4)', display: 'flex' }}>{icon}</span>
      <span style={{ color: active ? '#fff' : 'rgba(255,255,255,0.55)', fontSize: 13, fontWeight: active ? 600 : 500 }}>{label}</span>
      {active && <div style={sd.activeBar} />}
    </button>
  )
}

/* ─── Mobile bottom nav ───────────────────────────────────────────────── */
function MobileNav({ pathname, navigate, logout }) {
  return (
    <nav style={sm.nav}>
      <button onClick={() => navigate('/conversations')} style={{ ...sm.btn, ...(pathname === '/conversations' ? sm.btnActive : {}) }}>
        <span style={{ color: pathname === '/conversations' ? '#5e60ce' : '#8fa3bc', display: 'flex' }}><IconChat size={22} /></span>
        <span style={{ ...sm.btnLabel, color: pathname === '/conversations' ? '#5e60ce' : '#8fa3bc' }}>Conversations</span>
      </button>
      <button onClick={() => navigate('/settings')} style={{ ...sm.btn, ...(pathname === '/settings' ? sm.btnActive : {}) }}>
        <span style={{ color: pathname === '/settings' ? '#5e60ce' : '#8fa3bc', display: 'flex' }}><IconSettings size={22} /></span>
        <span style={{ ...sm.btnLabel, color: pathname === '/settings' ? '#5e60ce' : '#8fa3bc' }}>Paramètres</span>
      </button>
      <button onClick={logout} style={sm.btn}>
        <span style={{ color: '#8fa3bc', display: 'flex' }}><IconLogout size={22} /></span>
        <span style={{ ...sm.btnLabel, color: '#8fa3bc' }}>Déconnexion</span>
      </button>
    </nav>
  )
}

/* ─── Icons ───────────────────────────────────────────────────────────── */
const IconChat = ({ size = 17 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
)

const IconSettings = ({ size = 17 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
)

const IconLogout = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
)

/* ─── Styles desktop ──────────────────────────────────────────────────── */
const sd = {
  aside: { width: 230, minHeight: '100vh', background: '#11243e', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 200, fontFamily: "'Plus Jakarta Sans', sans-serif" },
  logoWrap: { 
    padding: '28px 20px 22px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: { height: 1, background: 'rgba(255,255,255,0.07)', margin: '0 16px' },
  nav: { flex: 1, padding: '16px 10px', display: 'flex', flexDirection: 'column', gap: 2 },
  section: { fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0 10px', marginBottom: 8 },
  navBtn: { display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10, border: 'none', background: 'transparent', cursor: 'pointer', width: '100%', position: 'relative', transition: 'background 0.15s' },
  navBtnActive: { background: 'rgba(255,255,255,0.1)' },
  activeBar: { position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 3, height: 20, background: 'linear-gradient(180deg,#56cfe1,#5e60ce)', borderRadius: '0 3px 3px 0' },
  bottom: { padding: '12px 10px 20px', display: 'flex', flexDirection: 'column', gap: 12 },
  user: { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px' },
  avatar: { width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg,#5e60ce,#7400b8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 800, flexShrink: 0 },
  userInfo: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 },
  userName: { fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.85)', display: 'block' },
  userRole: { fontSize: 11, color: 'rgba(255,255,255,0.3)', display: 'block' },
  logoutBtn: { background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'rgba(255,255,255,0.35)', padding: 4, flexShrink: 0 },
  gradLine: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg,#defcb9,#56cfe1,#5e60ce,#7400b8)' },
}

/* ─── Styles mobile ───────────────────────────────────────────────────── */
const sm = {
  nav: { position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid #e8edf3', display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '8px 0 calc(8px + env(safe-area-inset-bottom))', zIndex: 200, boxShadow: '0 -4px 20px rgba(17,36,62,0.08)' },
  btn: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 20px', flex: 1 },
  btnActive: {},
  btnLabel: { fontSize: 10, fontWeight: 600, letterSpacing: '0.01em' },
}
