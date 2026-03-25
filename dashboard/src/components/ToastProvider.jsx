import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useNotificationStore from '../stores/notificationStore'

/* ─── Store des toasts (indépendant du store notif) ─────────────────── */
let _setToasts = null
export function showToast(toast) {
  if (_setToasts) _setToasts(prev => [...prev, { ...toast, id: crypto.randomUUID() }])
}

/* ─── Provider — à placer une seule fois dans App.jsx ───────────────── */
export default function ToastProvider() {
  const [toasts, setToasts] = useState([])
  _setToasts = setToasts

  function dismiss(id) {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  return (
    <div style={s.container}>
      {toasts.map(t => (
        <Toast key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
      ))}
    </div>
  )
}

/* ─── Un toast individuel ────────────────────────────────────────────── */
function Toast({ toast, onDismiss }) {
  const navigate = useNavigate()
  const [visible, setVisible] = useState(false)
  const [leaving, setLeaving] = useState(false)

  // Animation d'entrée
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

  // Auto-dismiss après 5s
  useEffect(() => {
    const timer = setTimeout(() => close(), 5000)
    return () => clearTimeout(timer)
  }, [])

  function close() {
    setLeaving(true)
    setTimeout(onDismiss, 300)
  }

  function handleClick() {
    if (toast.conversationId) {
      navigate(`/conversations?id=${toast.conversationId}`)
    }
    close()
  }

  const isNewConv = toast.type === 'new_conversation'

  return (
    <div
      onClick={handleClick}
      style={{
        ...s.toast,
        opacity: visible && !leaving ? 1 : 0,
        transform: visible && !leaving ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.97)',
      }}
    >
      {/* Barre colorée à gauche */}
      <div style={{ ...s.accent, background: isNewConv ? 'linear-gradient(180deg,#56cfe1,#5e60ce)' : 'linear-gradient(180deg,#5e60ce,#7400b8)' }} />

      {/* Icône */}
      <div style={{ ...s.iconWrap, background: isNewConv ? '#eef9ff' : '#f5f3ff' }}>
        {isNewConv ? <IconNewConv /> : <IconMsg />}
      </div>

      {/* Contenu */}
      <div style={s.content}>
        <div style={s.toastTitle}>{toast.title}</div>
        <div style={s.toastBody}>{toast.body}</div>
        {toast.ticket && <div style={s.toastTicket}>{toast.ticket}</div>}
      </div>

      {/* Bouton fermer */}
      <button onClick={e => { e.stopPropagation(); close() }} style={s.closeBtn}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#b0bec5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>

      {/* Barre de progression */}
      <div style={s.progressTrack}>
        <div style={{ ...s.progressBar, background: isNewConv ? '#56cfe1' : '#5e60ce' }} />
      </div>
    </div>
  )
}

/* ─── Icons ──────────────────────────────────────────────────────────── */
function IconMsg() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5e60ce" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  )
}

function IconNewConv() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#56cfe1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      <line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
    </svg>
  )
}

/* ─── Styles ─────────────────────────────────────────────────────────── */
const s = {
  container: {
    position: 'fixed',
    bottom: 24,
    right: 24,
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    pointerEvents: 'none',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  toast: {
    width: 320,
    background: '#ffffff',
    borderRadius: 14,
    boxShadow: '0 8px 32px rgba(17,36,62,0.14), 0 2px 8px rgba(17,36,62,0.08)',
    border: '1px solid #e8edf3',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '14px 14px 18px 0',
    cursor: 'pointer',
    pointerEvents: 'all',
    position: 'relative',
    overflow: 'hidden',
    transition: 'opacity 0.3s ease, transform 0.3s ease',
  },
  accent: {
    width: 4,
    alignSelf: 'stretch',
    borderRadius: '0 3px 3px 0',
    flexShrink: 0,
    minHeight: 44,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  toastTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: '#11243e',
    marginBottom: 3,
    letterSpacing: '-0.1px',
  },
  toastBody: {
    fontSize: 12,
    color: '#536680',
    lineHeight: 1.4,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '200px',
  },
  toastTicket: {
    fontSize: 10,
    fontWeight: 700,
    color: '#8fa3bc',
    marginTop: 4,
    fontFamily: 'monospace',
    letterSpacing: '0.03em',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    flexShrink: 0,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  progressTrack: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    background: '#f1f5f9',
  },
  progressBar: {
    height: '100%',
    borderRadius: 99,
    animation: 'toast-progress 5s linear forwards',
    width: '100%',
  },
}
