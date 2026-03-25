const pool = require('./db/pool')

module.exports = function initSocket(io) {

  io.on('connection', (socket) => {
    console.log(`🔌 Nouvelle connexion : ${socket.id}`)

    // ─────────────────────────────────────────
    // Rejoindre une conversation
    // Appelé par le widget ET par le dashboard
    // ─────────────────────────────────────────
    socket.on('join_conversation', ({ conversationId }) => {
      if (!conversationId) return
      socket.join(conversationId)
      console.log(`👤 Socket ${socket.id} a rejoint la conv ${conversationId}`)
    })

    // ─────────────────────────────────────────
    // L'agent rejoint sa room client
    // Pour recevoir les notifications
    // ─────────────────────────────────────────
    socket.on('join_client_room', ({ clientId }) => {
      if (!clientId) return
      socket.join(`client_${clientId}`)
      console.log(`🏢 Agent ${socket.id} a rejoint la room client_${clientId}`)
    })

    // ─────────────────────────────────────────
    // Nouvelle conversation créée par le widget
    // ─────────────────────────────────────────
    socket.on('new_conversation', ({ conversationId, clientId }) => {
      if (!clientId) return

      // Notif pour la cloche 🔔
      io.to(`client_${clientId}`).emit('notification', {
        type: 'new_conversation',
        conversationId,
      })

      // Événement dédié pour rafraîchir la liste des conversations
      io.to(`client_${clientId}`).emit('conversation_created', {
        conversationId,
      })

      console.log(`💬 Nouvelle conv ${conversationId} pour client ${clientId}`)
    })

    // ─────────────────────────────────────────
    // Message envoyé par le visiteur (widget)
    // ─────────────────────────────────────────
    socket.on('visitor_message', async ({ conversationId, content }) => {
      if (!conversationId || !content) return

      try {
        const result = await pool.query(
          `INSERT INTO messages (conversation_id, sender_role, content)
           VALUES ($1, $2, $3)
           RETURNING *`,
          [conversationId, 'visitor', content]
        )

        const message = result.rows[0]

        // Réémettre à tous ceux dans la room (dashboard inclus)
        io.to(conversationId).emit('new_message', message)

        // Notifier les agents du client
        const convResult = await pool.query(
          'SELECT client_id FROM conversations WHERE id = $1',
          [conversationId]
        )

        if (convResult.rows.length > 0) {
          const clientId = convResult.rows[0].client_id
          io.to(`client_${clientId}`).emit('notification', {
            type: 'new_message',
            conversationId,
            content,
          })
        }

      } catch (err) {
        console.error('Erreur visitor_message :', err)
        socket.emit('error', { message: 'Erreur lors de l\'envoi du message' })
      }
    })

    // ─────────────────────────────────────────
    // Message envoyé par l'agent (dashboard)
    // ─────────────────────────────────────────
    socket.on('agent_message', async ({ conversationId, content }) => {
      if (!conversationId || !content) return

      try {
        const result = await pool.query(
          `INSERT INTO messages (conversation_id, sender_role, content)
           VALUES ($1, $2, $3)
           RETURNING *`,
          [conversationId, 'agent', content]
        )

        const message = result.rows[0]
        io.to(conversationId).emit('new_message', message)

      } catch (err) {
        console.error('Erreur agent_message :', err)
      }
    })

    // ─────────────────────────────────────────
    // Déconnexion
    // ─────────────────────────────────────────
    socket.on('disconnect', () => {
      console.log(`❌ Déconnexion : ${socket.id}`)
    })
  })
}