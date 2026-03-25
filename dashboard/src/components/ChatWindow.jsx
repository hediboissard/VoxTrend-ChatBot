import { useState, useEffect, useRef } from 'react'
import socket from '../lib/socket'
import api from '../lib/axios'

const API_BASE = 'http://localhost:3001'

export default function ChatWindow({ conversation, onBack }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(null) // { url, name, type } fichier en attente
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])

  useEffect(() => {
    if (!conversation) return
    setMessages([])
    api.get(`/conversations/${conversation.id}/messages`).then(r => setMessages(r.data)).catch(console.error)
    socket.emit('join_conversation', { conversationId: conversation.id })
    setTimeout(() => inputRef.current?.focus(), 200)
  }, [conversation?.id])

  useEffect(() => {
    socket.on('new_message', msg => {
      if (msg.conversation_id === conversation?.id)
        setMessages(p => [...p, msg])
    })
    return () => socket.off('new_message')
  }, [conversation?.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }, [input])

  function send() {
    if (!conversation) return

    // Si un fichier est en attente, l'envoyer comme message
    if (preview) {
      const content = JSON.stringify({
        type: 'file',
        url: preview.url,
        name: preview.name,
        fileType: preview.type,
      })
      socket.emit('agent_message', { conversationId: conversation.id, content })
      setPreview(null)
    }

    // Si du texte, l'envoyer
    const text = input.trim()
    if (text) {
      socket.emit('agent_message', { conversationId: conversation.id, content: text })
      setInput('')
      if (inputRef.current) inputRef.current.style.height = 'auto'
    }
  }

  async function handleFileSelect(e) {
    const file = e.target.files[0]
    if (!file) return
    e.target.value = ''

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setPreview({ url: res.data.url, name: res.data.name, type: res.data.type })
    } catch (err) {
      console.error('Erreur upload :', err)
    } finally {
      setUploading(false)
    }
  }

  function handleKeyDown(e) {
    if (e.shiftKey && e.key === ' ') {
      e.preventDefault()
      const el = inputRef.current
      const start = el.selectionStart
      const newValue = input.substring(0, start) + '\n' + input.substring(el.selectionEnd)
      setInput(newValue)
      requestAnimationFrame(() => { el.selectionStart = start + 1; el.selectionEnd = start + 1 })
      return
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  function canSend() {
    return input.trim() || preview
  }

  if (!conversation) return (
    <div style={s.blank}>
      <div style={s.blankCard}>
        <div style={s.blankIco}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <defs><linearGradient id="bli" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#5e60ce"/><stop offset="1" stopColor="#7400b8"/></linearGradient></defs>
            <path stroke="url(#bli)" d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </div>
        <h3 style={s.blankTitle}>Sélectionnez une conversation</h3>
        <p style={s.blankSub}>Choisissez une conversation dans la liste pour commencer à répondre.</p>
      </div>
    </div>
  )

  const initial = (conversation.visitor_name || 'V')[0].toUpperCase()

  return (
    <div style={s.root}>
      {/* Header */}
      <div style={{ ...s.header, ...(isMobile ? s.headerMobile : {}) }}>
        <div style={s.headerL}>
          {isMobile && onBack && (
            <button onClick={onBack} style={s.backBtn}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#11243e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
          )}
          <div style={s.hAvatar}>{initial}</div>
          <div>
            <div style={s.hName}>{conversation.visitor_name || 'Visiteur anonyme'}</div>
            <div style={s.hMeta}>
              <span style={s.onlineDot} />
              <span style={s.hDate}>
                {isMobile
                  ? new Date(conversation.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
                  : `Démarrée le ${new Date(conversation.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long' })} à ${new Date(conversation.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`}
              </span>
            </div>
          </div>
        </div>
        {!isMobile && (
          <span style={s.statusChip}>
            <span style={s.chipDot} />
            {conversation.status === 'open' ? 'En cours' : 'Fermée'}
          </span>
        )}
      </div>

      {/* Messages */}
      <div style={s.msgs}>
        {messages.length === 0 && <div style={s.noMsg}>Aucun message — démarrez la conversation !</div>}
        {messages.map((msg, i) => {
          const agent = msg.sender_role === 'agent'
          const prev = messages[i - 1]
          const showStamp = !prev || new Date(msg.created_at) - new Date(prev.created_at) > 300000
          return (
            <div key={msg.id}>
              {showStamp && (
                <div style={s.stamp}>
                  {new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
              <div style={{ ...s.row, justifyContent: agent ? 'flex-end' : 'flex-start' }}>
                {!agent && <div style={s.vAvatar}>{initial}</div>}
                <MessageBubble msg={msg} isAgent={agent} isMobile={isMobile} />
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Preview fichier en attente */}
      {preview && (
        <div style={s.previewBar}>
          <FilePreviewChip file={preview} onRemove={() => setPreview(null)} />
          <span style={s.previewHint}>Appuyez sur Envoyer pour envoyer ce fichier</span>
        </div>
      )}

      {/* Zone de saisie */}
      <div style={{ ...s.inputArea, ...(isMobile ? s.inputAreaMobile : {}) }}>
        <div style={s.inputBox}>
          {/* Bouton fichier */}
          <button
            onClick={() => fileInputRef.current?.click()}
            style={s.attachBtn}
            disabled={uploading}
            title="Joindre un fichier"
          >
            {uploading
              ? <span style={s.uploadSpinner} />
              : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
                </svg>
              )}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            style={{ display: 'none' }}
            accept="image/*,.pdf,.doc,.docx,.txt"
            onChange={handleFileSelect}
          />

          <textarea
            ref={inputRef}
            style={s.textarea}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Répondre au visiteur..."
            rows={1}
          />

          <button
            style={{ ...s.sendBtn, opacity: canSend() ? 1 : 0.4, cursor: canSend() ? 'pointer' : 'default' }}
            onClick={send}
            disabled={!canSend()}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="white">
              <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/>
            </svg>
          </button>
        </div>
        {!isMobile && <p style={s.hint}>Entrée pour envoyer · Shift+Espace pour sauter une ligne</p>}
      </div>
    </div>
  )
}

/* ─── Bulle de message — gère texte et fichiers ───────────────────── */
function MessageBubble({ msg, isAgent, isMobile }) {
  let parsed = null
  try {
    const p = JSON.parse(msg.content)
    if (p.type === 'file') parsed = p
  } catch (_) {}

  const bubbleStyle = {
    ...s.bubble,
    ...(isAgent ? s.bubbleAgent : s.bubbleVisitor),
    maxWidth: isMobile ? '82%' : '62%',
  }

  if (parsed) {
    const isImage = parsed.fileType?.startsWith('image/')
    return (
      <div style={bubbleStyle}>
        {isImage ? (
          <a href={`${API_BASE}${parsed.url}`} target="_blank" rel="noreferrer">
            <img
              src={`${API_BASE}${parsed.url}`}
              alt={parsed.name}
              style={s.imgPreview}
            />
          </a>
        ) : (
          <a href={`${API_BASE}${parsed.url}`} target="_blank" rel="noreferrer" style={{ ...s.fileLink, color: isAgent ? '#fff' : '#5e60ce' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            <span style={s.fileName}>{parsed.name}</span>
          </a>
        )}
      </div>
    )
  }

  return (
    <div style={bubbleStyle}>
      {msg.content.split('\n').map((line, j, arr) => (
        <span key={j}>{line}{j < arr.length - 1 && <br />}</span>
      ))}
    </div>
  )
}

/* ─── Chip de preview avant envoi ────────────────────────────────── */
function FilePreviewChip({ file, onRemove }) {
  const isImage = file.type?.startsWith('image/')
  return (
    <div style={s.chip}>
      {isImage ? (
        <img src={`${API_BASE}${file.url}`} alt={file.name} style={s.chipImg} />
      ) : (
        <div style={s.chipIcon}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5e60ce" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
        </div>
      )}
      <span style={s.chipName}>{file.name}</span>
      <button onClick={onRemove} style={s.chipRemove}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#8fa3bc" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  )
}

/* ─── Styles ──────────────────────────────────────────────────────── */
const s = {
  blank: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb', fontFamily: "'Plus Jakarta Sans', sans-serif" },
  blankCard: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, textAlign: 'center', maxWidth: 280, padding: '0 20px' },
  blankIco: { width: 72, height: 72, background: '#fff', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(17,36,62,0.08)', marginBottom: 6 },
  blankTitle: { fontSize: 17, fontWeight: 800, color: '#11243e', letterSpacing: '-0.3px' },
  blankSub: { fontSize: 13, color: '#8fa3bc', lineHeight: 1.65 },
  root: { flex: 1, display: 'flex', flexDirection: 'column', height: '100%', background: '#f9fafb', fontFamily: "'Plus Jakarta Sans', sans-serif", overflow: 'hidden' },
  header: { padding: '15px 24px', background: '#fff', borderBottom: '1px solid #e8edf3', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 },
  headerMobile: { padding: '12px 16px' },
  backBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px 4px 0', display: 'flex', alignItems: 'center', flexShrink: 0 },
  headerL: { display: 'flex', alignItems: 'center', gap: 10 },
  hAvatar: { width: 38, height: 38, borderRadius: 11, background: 'linear-gradient(135deg,#5e60ce,#7400b8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14, fontWeight: 800, flexShrink: 0 },
  hName: { fontSize: 14, fontWeight: 800, color: '#11243e', letterSpacing: '-0.2px', marginBottom: 2 },
  hMeta: { display: 'flex', alignItems: 'center', gap: 5 },
  onlineDot: { width: 6, height: 6, borderRadius: '50%', background: '#16a34a', flexShrink: 0 },
  hDate: { fontSize: 11, color: '#8fa3bc' },
  statusChip: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, background: '#f0fdf4', color: '#16a34a', padding: '5px 12px', borderRadius: 99, border: '1px solid #bbf7d0' },
  chipDot: { width: 6, height: 6, borderRadius: '50%', background: '#16a34a' },
  msgs: { flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 3 },
  noMsg: { textAlign: 'center', color: '#d1d9e4', fontSize: 13, paddingTop: 40 },
  stamp: { textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#b0bec5', margin: '14px 0 6px', letterSpacing: '0.02em' },
  row: { display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 2 },
  vAvatar: { width: 26, height: 26, borderRadius: 8, background: '#e8edf3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#8fa3bc', flexShrink: 0 },
  bubble: { padding: '10px 14px', borderRadius: 16, fontSize: 14, lineHeight: 1.5, wordBreak: 'break-word' },
  bubbleAgent: { background: 'linear-gradient(135deg,#5e60ce,#7400b8)', color: '#fff', borderBottomRightRadius: 4 },
  bubbleVisitor: { background: '#fff', color: '#11243e', borderBottomLeftRadius: 4, border: '1px solid #eef1f6', boxShadow: '0 1px 4px rgba(17,36,62,0.06)' },
  imgPreview: { maxWidth: '100%', maxHeight: 200, borderRadius: 10, display: 'block', cursor: 'pointer' },
  fileLink: { display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', fontWeight: 600, fontSize: 13 },
  fileName: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 },
  previewBar: { padding: '8px 16px', background: '#f5f3ff', borderTop: '1px solid #ede9fe', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 },
  previewHint: { fontSize: 11, color: '#8fa3bc' },
  chip: { display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1px solid #e8edf3', borderRadius: 8, padding: '5px 8px', maxWidth: 220 },
  chipImg: { width: 28, height: 28, borderRadius: 5, objectFit: 'cover', flexShrink: 0 },
  chipIcon: { width: 28, height: 28, borderRadius: 5, background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  chipName: { fontSize: 12, fontWeight: 500, color: '#11243e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 },
  chipRemove: { background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 2, flexShrink: 0 },
  inputArea: { padding: '12px 16px 16px', background: '#fff', borderTop: '1px solid #e8edf3', flexShrink: 0 },
  inputAreaMobile: { padding: '10px 12px', paddingBottom: 'calc(10px + env(safe-area-inset-bottom))' },
  inputBox: { display: 'flex', alignItems: 'flex-end', gap: 8, background: '#f5f7fa', border: '1.5px solid #e8edf3', borderRadius: 12, padding: '4px 4px 4px 8px' },
  attachBtn: { width: 32, height: 32, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8fa3bc', flexShrink: 0, transition: 'color 0.15s', marginBottom: 2 },
  uploadSpinner: { width: 14, height: 14, border: '2px solid #e8edf3', borderTopColor: '#5e60ce', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' },
  textarea: { flex: 1, border: 'none', background: 'transparent', fontSize: 14, color: '#11243e', outline: 'none', padding: '8px 0', fontFamily: "'Plus Jakarta Sans', sans-serif", resize: 'none', lineHeight: '1.5', minHeight: '36px', maxHeight: '120px', overflowY: 'auto' },
  sendBtn: { width: 36, height: 36, borderRadius: 9, background: 'linear-gradient(135deg,#5e60ce,#7400b8)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'opacity 0.15s', flexShrink: 0, marginBottom: 2 },
  hint: { fontSize: 11, color: '#c8d3de', marginTop: 7, paddingLeft: 4 },
}
