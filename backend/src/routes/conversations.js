const express = require('express')
const router = express.Router()
const pool = require('../db/pool')
const authMiddleware = require('../middleware/auth')

// POST /api/conversations
// Appelée par le widget quand un visiteur ouvre le chat
// Pas de JWT ici — le widget s'authentifie avec l'apiKey dans le body
router.post('/', async (req, res) => {
  const { clientId, visitorId, visitorName } = req.body

  if (!clientId || !visitorId) {
    return res.status(400).json({ error: 'clientId et visitorId requis' })
  }

  try {
    // Vérifier que le client existe
    const clientCheck = await pool.query(
      'SELECT id FROM clients WHERE id = $1',
      [clientId]
    )

    if (clientCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Client introuvable' })
    }

    // Créer la conversation
    const result = await pool.query(
      `INSERT INTO conversations (client_id, visitor_id, visitor_name)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [clientId, visitorId, visitorName || null]
    )

    res.status(201).json(result.rows[0])

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// GET /api/conversations?search=TKT-50
router.get('/', authMiddleware, async (req, res) => {
  const { search } = req.query

  try {
    let query
    let params

    if (search) {
      // Extraire le numéro depuis "TKT-50" → 50
      const match = search.trim().toUpperCase().match(/^TKT-?(\d+)$/)

      if (match) {
        const num = parseInt(match[1])
        query = `
          SELECT
            c.*,
            COUNT(m.id) AS message_count,
            MAX(m.created_at) AS last_message_at
          FROM conversations c
          LEFT JOIN messages m ON m.conversation_id = c.id
          WHERE c.client_id = $1 AND c.ticket_number = $2
          GROUP BY c.id
          ORDER BY last_message_at DESC NULLS LAST
        `
        params = [req.user.clientId, num]
      } else {
        // Recherche par nom de visiteur si ce n'est pas un numéro TKT
        query = `
          SELECT
            c.*,
            COUNT(m.id) AS message_count,
            MAX(m.created_at) AS last_message_at
          FROM conversations c
          LEFT JOIN messages m ON m.conversation_id = c.id
          WHERE c.client_id = $1
            AND LOWER(c.visitor_name) LIKE LOWER($2)
          GROUP BY c.id
          ORDER BY last_message_at DESC NULLS LAST
        `
        params = [req.user.clientId, `%${search}%`]
      }
    } else {
      query = `
        SELECT
          c.*,
          COUNT(m.id) AS message_count,
          MAX(m.created_at) AS last_message_at
        FROM conversations c
        LEFT JOIN messages m ON m.conversation_id = c.id
        WHERE c.client_id = $1
        GROUP BY c.id
        ORDER BY last_message_at DESC NULLS LAST
      `
      params = [req.user.clientId]
    }

    const result = await pool.query(query, params)
    res.json(result.rows)

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// GET /api/conversations/widget?visitorId=xxx&clientId=xxx
// Liste toutes les conversations d'un visiteur — route publique pour le widget
router.get('/widget', async (req, res) => {
  const { visitorId, clientId } = req.query

  if (!visitorId || !clientId) {
    return res.status(400).json({ error: 'visitorId et clientId requis' })
  }

  try {
    const result = await pool.query(
      `SELECT c.*,
        COUNT(m.id) AS message_count,
        MAX(m.created_at) AS last_message_at,
        (SELECT content FROM messages
         WHERE conversation_id = c.id
         ORDER BY created_at DESC LIMIT 1) AS last_message
       FROM conversations c
       LEFT JOIN messages m ON m.conversation_id = c.id
       WHERE c.visitor_id = $1 AND c.client_id = $2
       GROUP BY c.id
       ORDER BY COALESCE(MAX(m.created_at), c.created_at) DESC`,
      [visitorId, clientId]
    )
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// GET /api/conversations/:id/messages
// L'historique complet d'une conversation
// JWT obligatoire
router.get('/:id/messages', authMiddleware, async (req, res) => {
  const { id } = req.params

  try {
    // Vérifier que la conversation appartient bien au client de l'agent
    const convCheck = await pool.query(
      'SELECT id FROM conversations WHERE id = $1 AND client_id = $2',
      [id, req.user.clientId]
    )

    if (convCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Conversation introuvable' })
    }

    const result = await pool.query(
      'SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC',
      [id]
    )

    res.json(result.rows)

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// GET /api/conversations/:id/messages/widget?visitorId=xxx
// Route publique pour le widget — vérifie que le visiteur est bien dans cette conv
router.get('/:id/messages/widget', async (req, res) => {
  const { id } = req.params
  const { visitorId } = req.query

  if (!visitorId) return res.status(400).json({ error: 'visitorId requis' })

  try {
    const convCheck = await pool.query(
      'SELECT id FROM conversations WHERE id = $1 AND visitor_id = $2',
      [id, visitorId]
    )
    if (convCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Accès refusé' })
    }

    const result = await pool.query(
      'SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC',
      [id]
    )
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

module.exports = router