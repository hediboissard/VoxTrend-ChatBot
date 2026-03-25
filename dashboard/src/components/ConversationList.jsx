import { useEffect, useState, useCallback } from 'react'
import api from '../lib/axios'

export default function ConversationList({ conversations, setConversations, selectedId, unreadIds, onSelect }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [search, setSearch] = useState('')
  const [searching, setSearching] = useState(false)
  const unreadCount = unreadIds?.size || 0

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])

  // Debounce la recherche — attend 300ms après la dernière frappe
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchWithSearch(search)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  async function fetchWithSearch(value) {
    setSearching(true)
    try {
      const params = value.trim() ? `?search=${encodeURIComponent(value.trim())}` : ''
      const res = await api.get(`/conversations${params}`)
      const sorted = res.data.sort((a, b) => {
        const da = new Date(a.last_message_at || a.created_at)
        const db = new Date(b.last_message_at || b.created_at)
        return db - da
      })
      setConversations(sorted)
    } catch (err) {
      console.error(err)
    } finally {
      setSearching(false)
    }
  }

  function handleClear() {
    setSearch('')
  }

  return (
    <div style={{ ...s.wrap, ...(isMobile ? s.wrapMobile : {}) }}>
      {/* Header */}
      <div style={{ ...s.header, ...(isMobile ? s.headerMobile : {}) }}>
        <div style={s.headerRow}>
          <h2 style={s.title}>Conversations</h2>
          {unreadCount > 0 && (
            <span style={s.unreadPill}>{unreadCount} non lu{unreadCount > 1 ? 's' : ''}</span>
          )}
        </div>

        {/* Barre de recherche */}
        <div style={s.searchRow}>
          <div style={s.searchWrap}>
            {searching ? (
              <span style={s.searchSpinner} />
            ) : (
              <svg style={s.searchIco} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#b0bec5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            )}
            <input
              style={s.search}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher... ex: TKT-12"
            />
            {search && (
              <button onClick={handleClear} style={s.clearBtn}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#b0bec5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Indicateur de recherche active */}
        {search && !searching && (
          <div style={s.searchStatus}>
            {conversations.length === 0
              ? <span style={s.searchNoResult}>Aucun résultat pour « {search} »</span>
              : <span style={s.searchResult}>{conversations.length} résultat{conversations.length > 1 ? 's' : ''}</span>
            }
          </div>
        )}
      </div>

      {/* Liste */}
      <div style={s.list}>
        {conversations.length === 0 && !searching ? (
          <div style={s.empty}>
            <div style={s.emptyIco}>
              {search ? (
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#d1d9e4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              ) : (
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#d1d9e4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              )}
            </div>
            <p style={s.emptyText}>{search ? 'Ticket introuvable' : 'Aucune conversation'}</p>
            <p style={s.emptySub}>{search ? `Vérifiez le numéro (ex: TKT-${Math.floor(Math.random()*100)+1})` : 'Les conversations apparaîtront ici'}</p>
          </div>
        ) : (
          conversations.map(conv => {
            const active = selectedId === conv.id
            const unread = unreadIds?.has(conv.id)
            const ticketLabel = `TKT-${conv.ticket_number}`

            return (
              <div key={conv.id} onClick={() => onSelect(conv)}
                style={{ ...s.item, ...(active ? s.itemActive : unread ? s.itemUnread : {}) }}>
                {active && <div style={s.activeBar} />}

                {/* Avatar */}
                <div style={{ ...s.avatar, background: unread ? 'linear-gradient(135deg,#5e60ce,#7400b8)' : active ? '#eef0ff' : '#f5f7fa' }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: unread ? '#fff' : active ? '#5e60ce' : '#8fa3bc' }}>
                    {(conv.visitor_name || 'V')[0].toUpperCase()}
                  </span>
                </div>

                {/* Contenu */}
                <div style={s.content}>
                  <div style={s.row1}>
                    <span style={{ ...s.name, fontWeight: unread ? 700 : 500, color: unread || active ? '#11243e' : '#536680' }}>
                      {conv.visitor_name || 'Visiteur anonyme'}
                    </span>
                    <span style={s.time}>{relativeTime(conv.last_message_at || conv.created_at)}</span>
                  </div>
                  <div style={s.row2}>
                    {/* Badge ticket numéroté */}
                    <span style={{ ...s.ticketBadge, ...(active ? s.ticketBadgeActive : {}) }}>
                      {ticketLabel}
                    </span>
                    <span style={{ ...s.dot, background: conv.status === 'open' ? '#16a34a' : '#b0bec5' }} />
                    <span style={s.statusTxt}>{conv.status === 'open' ? 'En cours' : 'Fermée'}</span>
                    {unread && <span style={s.newTag}>nouveau</span>}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

function relativeTime(str) {
  if (!str) return ''
  const d = new Date(str), now = new Date(), diff = now - d
  if (diff < 60000) return "À l'instant"
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
}

const s = {
  wrap: { width: 290, flexShrink: 0, background: '#fff', borderRight: '1px solid #e8edf3', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: "'Plus Jakarta Sans', sans-serif" },
  wrapMobile: { width: '100%', height: '100%', borderRight: 'none' },

  header: { padding: '20px 16px 12px', borderBottom: '1px solid #f5f7fa', flexShrink: 0 },
  headerMobile: { padding: '16px 16px 12px' },

  headerRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  title: { fontSize: 15, fontWeight: 800, color: '#11243e', letterSpacing: '-0.2px' },
  unreadPill: { fontSize: 11, fontWeight: 700, background: 'linear-gradient(135deg,#5e60ce,#7400b8)', color: '#fff', padding: '3px 10px', borderRadius: 99 },

  searchRow: { marginBottom: 0 },
  searchWrap: { position: 'relative', display: 'flex', alignItems: 'center' },
  searchIco: { position: 'absolute', left: 10, pointerEvents: 'none', flexShrink: 0 },
  searchSpinner: {
    position: 'absolute', left: 10,
    width: 13, height: 13,
    border: '2px solid #e8edf3',
    borderTopColor: '#5e60ce',
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
    flexShrink: 0,
  },
  search: { width: '100%', padding: '9px 32px 9px 30px', borderRadius: 9, border: '1.5px solid #f0f3f7', background: '#f9fafb', fontSize: 13, color: '#11243e', outline: 'none', fontFamily: "'Plus Jakarta Sans', sans-serif", transition: 'border-color 0.15s' },
  clearBtn: { position: 'absolute', right: 10, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 2 },

  searchStatus: { marginTop: 8 },
  searchResult: { fontSize: 11, color: '#8fa3bc', fontWeight: 500 },
  searchNoResult: { fontSize: 11, color: '#ef4444', fontWeight: 500 },

  list: { flex: 1, overflowY: 'auto' },

  empty: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '56px 20px', gap: 10, textAlign: 'center' },
  emptyIco: { width: 56, height: 56, background: '#f5f7fa', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyText: { fontSize: 13, fontWeight: 700, color: '#b0bec5' },
  emptySub: { fontSize: 12, color: '#d1d9e4' },

  item: { display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', cursor: 'pointer', borderBottom: '1px solid #fafbfc', position: 'relative', transition: 'background 0.1s' },
  itemActive: { background: '#f5f3ff' },
  itemUnread: { background: '#fdfcff' },
  activeBar: { position: 'absolute', left: 0, top: 10, bottom: 10, width: 3, background: 'linear-gradient(180deg,#5e60ce,#7400b8)', borderRadius: '0 3px 3px 0' },

  avatar: { width: 38, height: 38, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  content: { flex: 1, minWidth: 0 },
  row1: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 },
  name: { fontSize: 13, letterSpacing: '-0.1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '68%' },
  time: { fontSize: 11, color: '#b0bec5', flexShrink: 0 },
  row2: { display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'nowrap' },

  ticketBadge: { fontSize: 10, fontWeight: 700, background: '#f1f5f9', color: '#64748b', padding: '2px 7px', borderRadius: 5, letterSpacing: '0.03em', flexShrink: 0, fontFamily: 'monospace' },
  ticketBadgeActive: { background: '#ede9fe', color: '#5e60ce' },

  dot: { width: 5, height: 5, borderRadius: '50%', flexShrink: 0 },
  statusTxt: { fontSize: 11, color: '#b0bec5' },
  newTag: { fontSize: 10, fontWeight: 700, background: '#ede9fe', color: '#7c3aed', padding: '1px 7px', borderRadius: 99, marginLeft: 'auto', flexShrink: 0 },
}
