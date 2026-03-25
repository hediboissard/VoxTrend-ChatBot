import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import ConversationList from '../components/ConversationList'
import ChatWindow from '../components/ChatWindow'
import { useSocketNotifications } from '../hooks/useSocketNotifications'
import api from '../lib/axios'
import socket from '../lib/socket'

export default function Conversations() {
  const [conversations, setConversations] = useState([])
  const [selected, setSelected] = useState(null)
  const [unreadIds, setUnreadIds] = useState(new Set())
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [mobileView, setMobileView] = useState('list')
  const [searchParams] = useSearchParams()

  useSocketNotifications()

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])

  function fetchConversations() {
    api.get('/conversations').then(res => {
      const sorted = res.data.sort((a, b) => {
        const da = new Date(a.last_message_at || a.created_at)
        const db = new Date(b.last_message_at || b.created_at)
        return db - da
      })
      setConversations(sorted)
    }).catch(console.error)
  }

  function handleSelect(conv) {
    setSelected(conv)
    setUnreadIds(prev => { const n = new Set(prev); n.delete(conv.id); return n })
    if (isMobile) setMobileView('chat')
  }

  function handleBack() {
    setMobileView('list')
    setSelected(null)
  }

  useEffect(() => {
    if (!socket.connected) socket.connect()
    fetchConversations()

    socket.on('conversation_created', ({ conversationId }) => {
      fetchConversations()
      setUnreadIds(prev => new Set(prev).add(conversationId))
    })

    socket.on('notification', data => {
      if (data.type === 'new_message') {
        setSelected(cur => {
          if (cur?.id !== data.conversationId)
            setUnreadIds(prev => new Set(prev).add(data.conversationId))
          return cur
        })
        fetchConversations()
      }
    })

    return () => {
      socket.off('conversation_created')
      socket.off('notification')
    }
  }, [])

  useEffect(() => {
    const id = searchParams.get('id')
    if (!id) return
    const conv = conversations.find(c => c.id === id)
    if (conv) { handleSelect(conv); return }
    api.get('/conversations').then(res => {
      setConversations(res.data)
      const found = res.data.find(c => c.id === id)
      if (found) handleSelect(found)
    })
  }, [searchParams])

  const listProps = {
    conversations,
    setConversations, // ← nécessaire pour que la recherche mette à jour la liste
    selectedId: selected?.id,
    unreadIds,
    onSelect: handleSelect,
  }

  if (isMobile) {
    return (
      <div style={sm.root}>
        <div style={sm.content}>
          {mobileView === 'list'
            ? <ConversationList {...listProps} />
            : <ChatWindow conversation={selected} onBack={handleBack} />
          }
        </div>
        <Navbar />
      </div>
    )
  }

  return (
    <div style={sd.root}>
      <Navbar />
      <div style={sd.main}>
        <ConversationList {...listProps} />
        <ChatWindow conversation={selected} />
      </div>
    </div>
  )
}

const sd = {
  root: { display: 'flex', height: '100vh', overflow: 'hidden', fontFamily: "'Plus Jakarta Sans', sans-serif" },
  main: { marginLeft: 230, flex: 1, display: 'flex', overflow: 'hidden', height: '100vh' },
}
const sm = {
  root: { display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', fontFamily: "'Plus Jakarta Sans', sans-serif", background: '#fff' },
  content: { flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' },
}
