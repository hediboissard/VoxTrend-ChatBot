import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useNotificationStore from '../stores/notificationStore'

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const { notifications, markAllAsRead } = useNotificationStore()
  const navigate = useNavigate()
  const ref = useRef(null)
  const unread = notifications.filter(n => !n.read).length

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])

  useEffect(() => {
    function onOut(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onOut)
    return () => document.removeEventListener('mousedown', onOut)
  }, [])

  function toggle() { setOpen(v => !v); if (!open) markAllAsRead() }
  function go(notif) { setOpen(false); navigate(`/conversations?id=${notif.conversationId}`) }

  if (isMobile) {
    // Sur mobile : juste un badge dans la bottom nav, géré directement dans Navbar
    // On expose juste le unreadCount via le store
    return null
  }

  return (
    <div ref={ref} style={{ position: 'relative', padding: '0 10px' }}>
      <button onClick={toggle} style={s.bell}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        <span style={s.bellLabel}>Notifications</span>
        {unread > 0 && <span style={s.badge}>{unread > 9 ? '9+' : unread}</span>}
      </button>

      {open && (
        <div style={s.panel}>
          <div style={s.panelTop}>
            <span style={s.panelTitle}>Notifications</span>
            {notifications.length > 0 && <span style={s.panelCount}>{notifications.length}</span>}
          </div>
          <div style={s.list}>
            {notifications.length === 0
              ? <div style={s.empty}>Aucune notification</div>
              : notifications.map(n => (
                <div key={n.id} onClick={() => go(n)} style={{ ...s.item, background: n.read ? 'transparent' : '#f5f3ff' }}>
                  <div style={{ ...s.dot, background: n.read ? '#e8edf3' : 'linear-gradient(135deg,#5e60ce,#7400b8)' }} />
                  <div style={s.itemContent}>
                    <div style={s.itemTitle}>{n.title}</div>
                    <div style={s.itemBody}>{n.body}</div>
                  </div>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#b0bec5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}

const s = {
  bell: { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.55)', cursor: 'pointer', position: 'relative', width: '100%', transition: 'background 0.15s' },
  bellLabel: { flex: 1, fontSize: 13, fontWeight: 500, textAlign: 'left' },
  badge: { background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: '#fff', fontSize: 10, fontWeight: 800, minWidth: 18, height: 18, borderRadius: 99, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', border: '2px solid #11243e' },
  panel: { position: 'absolute', bottom: '48px', left: 0, right: 0, background: '#fff', borderRadius: 14, boxShadow: '0 -8px 40px rgba(17,36,62,0.14)', border: '1px solid #e8edf3', overflow: 'hidden', zIndex: 500 },
  panelTop: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid #f5f7fa' },
  panelTitle: { fontSize: 13, fontWeight: 700, color: '#11243e' },
  panelCount: { fontSize: 11, fontWeight: 600, background: '#f5f7fa', color: '#8fa3bc', padding: '2px 8px', borderRadius: 99 },
  list: { maxHeight: 280, overflowY: 'auto' },
  empty: { padding: '24px 16px', fontSize: 13, color: '#b0bec5', textAlign: 'center' },
  item: { display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid #f9fafb', transition: 'background 0.1s' },
  dot: { width: 8, height: 8, borderRadius: '50%', flexShrink: 0 },
  itemContent: { flex: 1, minWidth: 0 },
  itemTitle: { fontSize: 12, fontWeight: 700, color: '#11243e', marginBottom: 2 },
  itemBody: { fontSize: 12, color: '#8fa3bc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
}
